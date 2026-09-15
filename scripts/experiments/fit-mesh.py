"""Stronger nonrigid alternative. ONE source image; sparse UV mesh (25x19).
Only training frames determine mesh keyframes. No target pixels at runtime.
"""
from pathlib import Path
import cv2,numpy as np,json
# Import definitions without re-running first experiment suite.
scope={};exec(Path('scripts/experiments/fit-motion.py').read_text().split("report={'createdAt'")[0],scope)
metrics=scope['metrics'];resize=scope['resized'];OUT=Path('experiments/media-replacement');report=json.loads((OUT/'results.json').read_text());records=[];cv2.setNumThreads(2)
for id in ['plan-tail','tree-tail','signal-video','colossus-video','reveal-video','footer-loop-video']:
 item=next(x for x in report['experiments']if x['id']==id);folder=OUT/id;motion=json.loads((folder/'motion.json').read_text());source=item['source'];frames=[]
 if 'folder'in source:
  frames=[resize(cv2.imread(str(Path(source['folder'])/f'f_{i:03}.webp')))for i in range(source['first'],source['last']+1)]
 else:
  cap=cv2.VideoCapture(source['file'])
  for sec in np.linspace(0,9.9,61):cap.set(cv2.CAP_PROP_POS_MSEC,float(sec)*1000);ok,f=cap.read();assert ok;frames.append(resize(f))
  cap.release()
 anchor=cv2.imread(str(folder/'anchor.webp'));h,w=anchor.shape[:2];gy,gx=19,25;yy,xx=np.mgrid[0:h,0:w].astype(np.float32);keys=[]
 for key in motion['keyframes']:
  assert key['matrix'] is not None
  H=np.array(key['matrix']).reshape(3,3);inv=np.linalg.inv(H);target=frames[key['index']];warped=cv2.warpPerspective(anchor,H,(w,h))
  flow=cv2.calcOpticalFlowFarneback(cv2.cvtColor(target,cv2.COLOR_BGR2GRAY),cv2.cvtColor(warped,cv2.COLOR_BGR2GRAY),None,.5,4,35,5,7,1.5,0)
  pts=np.dstack([xx+flow[:,:,0],yy+flow[:,:,1]]).reshape(-1,1,2);uv=cv2.perspectiveTransform(pts,inv).reshape(h,w,2);uv[:,:,0]/=w-1;uv[:,:,1]/=h-1
  gridx,gridy=np.meshgrid(np.linspace(0,w-1,gx,dtype=np.float32),np.linspace(0,h-1,gy,dtype=np.float32));grid=cv2.remap(uv,gridx,gridy,cv2.INTER_LINEAR);keys.append({'index':key['index'],'uv':np.round(grid.reshape(-1),6).tolist()})
 rows=[]
 for i,target in enumerate(frames):
  left=max((k for k in keys if k['index']<=i),key=lambda k:k['index']);right=min((k for k in keys if k['index']>=i),key=lambda k:k['index']);t=(i-left['index'])/max(1,right['index']-left['index']);grid=(np.array(left['uv'])*(1-t)+np.array(right['uv'])*t).astype(np.float32).reshape(gy,gx,2)
  mapx,mapy=np.meshgrid(np.linspace(0,gx-1,w,dtype=np.float32),np.linspace(0,gy-1,h,dtype=np.float32));uv=cv2.remap(grid,mapx,mapy,cv2.INTER_LINEAR);pred=cv2.remap(anchor,uv[:,:,0]*(w-1),uv[:,:,1]*(h-1),cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(30,30,30));coverage=float(((uv>=0)&(uv<=1)).all(axis=2).mean());rows.append({'index':i,'heldOut':i not in item['trainingIndices'],'coverage':coverage,**metrics(target,pred)})
  if i in item['evidenceIndices']:cv2.imwrite(str(folder/f'mesh-{i}.webp'),pred,[cv2.IMWRITE_WEBP_QUALITY,95])
 runtime={'width':w,'height':h,'columns':gx,'rows':gy,'frames':len(frames),'keyframes':keys};(folder/'mesh.json').write_text(json.dumps(runtime,separators=(',',':')))
 hold=[r for r in rows if r['heldOut']];summary={k:float(np.mean([r[k]for r in hold]))for k in ['ssim','mae','coverage']};summary['worstSsim']=min(r['ssim']for r in hold)
 record={'id':id,'metrics':summary,'heldOutCount':len(hold),'vertexCount':gx*gy,'keyframeCount':len(keys),'parameterBytes':(folder/'mesh.json').stat().st_size,'rows':rows,'candidate':summary['ssim']>=.94 and summary['worstSsim']>=.9 and summary['coverage']>=.99};records.append(record);print(id,summary,flush=True)
(OUT/'mesh-results.json').write_text(json.dumps({'method':'Sparse 25x19 UV deformation from training-only optical flow; temporal interpolation; single anchor image','experiments':records},ensure_ascii=False,indent=2))
