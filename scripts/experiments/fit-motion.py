"""Single still + sparse camera transforms. Target pixels never enter runtime inputs.
Every tenth frame fits one transform. Other frames are held out for evaluation.
A failed model is reported as failed, never as proof no procedural method exists.
"""
from pathlib import Path
import cv2, numpy as np, json, hashlib, time
cv2.setNumThreads(2)
ROOT=Path.cwd(); OUT=ROOT/'experiments/media-replacement'; OUT.mkdir(parents=True,exist_ok=True)
W=480
specs=[('plan-tail','平面图后段','plan',80,121,121),('tree-tail','树冠后段','tree',90,121,121),('coda-tail','递图后段','coda',55,89,89)]
for label,title,folder in [('plan','完整平面图','plan'),('tree','完整树场景','tree'),('coda','完整递图','coda'),('flight','穿越天空','flysky'),('transition','页脚过渡','trans'),('grafting','嫁接到切梨','model/renaissance/1440'),('signal-bridge','举梨进入嫁接','model/v28/1440'),('colossus-bridge','巨梨进入嫁接','model/v51/1440'),('reveal-bridge','揭幕进入嫁接','model/v61/1440')]:
 count=len(list((ROOT/'films'/folder).glob('f_*.webp')));specs.append((label,title,folder,1,count,(count+1)//2))

def resized(img):return cv2.resize(img,(W,round(img.shape[0]*W/img.shape[1])),interpolation=cv2.INTER_AREA)
def metrics(a,b):
 a=a.astype(np.float32);b=b.astype(np.float32);ma=cv2.GaussianBlur(a,(11,11),1.5);mb=cv2.GaussianBlur(b,(11,11),1.5)
 va=cv2.GaussianBlur(a*a,(11,11),1.5)-ma*ma;vb=cv2.GaussianBlur(b*b,(11,11),1.5)-mb*mb;cov=cv2.GaussianBlur(a*b,(11,11),1.5)-ma*mb
 s=((2*ma*mb+6.5025)*(2*cov+58.5225))/((ma*ma+mb*mb+6.5025)*(va+vb+58.5225))
 return {'mae':float(np.mean(abs(a-b))/255),'ssim':float(s.mean())}
sift=cv2.SIFT_create(nfeatures=1800);matcher=cv2.BFMatcher()
def fit(anchor,frame,features):
 kp,des=features;kq,deq=sift.detectAndCompute(cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY),None)
 if des is None or deq is None:return None,0
 matches=[m for pair in matcher.knnMatch(des,deq,k=2) if len(pair)==2 for m,n in [pair] if m.distance<.7*n.distance]
 if len(matches)<12:return None,len(matches)
 src=np.float32([kp[m.queryIdx].pt for m in matches]);dst=np.float32([kq[m.trainIdx].pt for m in matches]);H,mask=cv2.findHomography(src,dst,cv2.RANSAC,2.5)
 if H is None or int(mask.sum())<10:return None,0
 H=H/H[2,2]
 corners=cv2.perspectiveTransform(np.float32([[[0,0],[W,0],[W,frame.shape[0]],[0,frame.shape[0]]]]),H)[0]
 if not np.isfinite(corners).all() or abs(cv2.contourArea(corners))<W*frame.shape[0]*.08 or abs(cv2.contourArea(corners))>W*frame.shape[0]*15:return None,int(mask.sum())
 return H,int(mask.sum())

def experiment(label,title,frames,anchor_index,source_info):
 start=time.time();folder=OUT/label;folder.mkdir(exist_ok=True);anchor=frames[anchor_index];height=anchor.shape[0];cv2.imwrite(str(folder/'anchor.webp'),anchor,[cv2.IMWRITE_WEBP_QUALITY,95]);features=sift.detectAndCompute(cv2.cvtColor(anchor,cv2.COLOR_BGR2GRAY),None)
 n=len(frames);train=sorted(set([0,n-1,anchor_index]+list(range(0,n,10))));keyframes=[]
 for i in train:
  H,inliers=(np.eye(3),999) if i==anchor_index else fit(anchor,frames[i],features)
  keyframes.append({'index':i,'progress':i/(n-1),'matrix':H.reshape(-1).tolist() if H is not None else None,'inliers':inliers})
 def predict(i):
  left=max((k for k in keyframes if k['index']<=i),key=lambda k:k['index']);right=min((k for k in keyframes if k['index']>=i),key=lambda k:k['index']);valid=left['matrix'] is not None and right['matrix'] is not None
  if not valid:return np.eye(3),False
  f=(i-left['index'])/max(1,right['index']-left['index']);return (np.array(left['matrix'])*(1-f)+np.array(right['matrix'])*f).reshape(3,3),True
 rows=[];evidence=[]
 for i,frame in enumerate(frames):
  H,valid=predict(i);pred=cv2.warpPerspective(anchor,H,(W,height),borderMode=cv2.BORDER_CONSTANT,borderValue=(30,30,30));mask=cv2.warpPerspective(np.full(anchor.shape[:2],255,np.uint8),H,(W,height));covered=float((mask>250).mean())
  rows.append({'index':i,'heldOut':i not in train,'fitAvailable':valid,'coverage':covered,**metrics(frame,pred),'static':metrics(frame,anchor)})
  if i in set(round((n-1)*x)for x in [.125,.375,.625,.875]):
   cv2.imwrite(str(folder/f'target-{i}.webp'),frame,[cv2.IMWRITE_WEBP_QUALITY,95]);cv2.imwrite(str(folder/f'prediction-{i}.webp'),pred,[cv2.IMWRITE_WEBP_QUALITY,95]);delta=cv2.absdiff(frame,pred);cv2.imwrite(str(folder/f'diff-{i}.webp'),np.minimum(delta.astype(np.uint16)*3,255).astype(np.uint8));evidence.append(i)
 held=[r for r in rows if r['heldOut']];mean=lambda k:float(np.mean([r[k]for r in held]));avg={'mae':mean('mae'),'ssim':mean('ssim'),'coverage':mean('coverage'),'fitAvailable':mean('fitAvailable'),'staticMae':float(np.mean([r['static']['mae']for r in held])),'staticSsim':float(np.mean([r['static']['ssim']for r in held])),'worstSsim':min(r['ssim']for r in held)}
 # A strict exploration gate, not a validated perceptual or final artistic acceptance score.
 candidate=avg['ssim']>=.94 and avg['coverage']>=.99 and avg['fitAvailable']==1 and avg['worstSsim']>=.9
 runtime={'width':W,'height':height,'anchor':'anchor.webp','frames':n,'keyframes':keyframes};(folder/'motion.json').write_text(json.dumps(runtime,indent=2));
 # Contact sheet and side-by-side browser-playable reference video (evidence only).
 sheet=np.full((len(evidence)*height,W*3,3),240,np.uint8)
 for row,i in enumerate(evidence):
  a=cv2.imread(str(folder/f'target-{i}.webp'));b=cv2.imread(str(folder/f'prediction-{i}.webp'));d=cv2.imread(str(folder/f'diff-{i}.webp'));sheet[row*height:(row+1)*height]=np.hstack([a,b,d])
 cv2.imwrite(str(folder/'comparison.jpg'),sheet,[cv2.IMWRITE_JPEG_QUALITY,90])
 record={'id':label,'title':title,'source':source_info,'count':n,'anchorIndex':anchor_index,'trainingIndices':train,'heldOutCount':len(held),'runtimeInputs':['anchor.webp','motion.json'],'evidenceIndices':evidence,'metrics':avg,'candidate':candidate,'status':'候选，仍需人工验收' if candidate else '本方法未达到替代标准','rows':rows,'runtimeBytes':(folder/'anchor.webp').stat().st_size+(folder/'motion.json').stat().st_size}
 print(label, {k:round(v,4)for k,v in avg.items()},flush=True);return record
report={'createdAt':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'method':'One still and sparse homographies fitted on every tenth frame; held-out frames evaluated. Homography coefficients interpolated. Missing fits use a visible identity baseline and are counted as failures.','thresholds':{'meanSsim':.94,'minCoverage':.99,'allFitsRequired':True,'worstSsim':.9},'experiments':[]}
for label,title,folder,first,last,anchor in specs:
 paths=[ROOT/'films'/folder/f'f_{i:03}.webp'for i in range(first,last+1)];frames=[resized(cv2.imread(str(p)))for p in paths];r=experiment(label,title,frames,anchor-first,{'folder':'films/'+folder,'first':first,'last':last,'anchor':'films/'+folder+f'/f_{anchor:03}.webp','bytes':sum(p.stat().st_size for p in paths)});report['experiments'].append(r);(OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
for name in ['signal','colossus','reveal','footer-loop']:
 path=ROOT/'films'/f'{name}.mp4';cap=cv2.VideoCapture(str(path));frames=[]
 for t in np.linspace(0,9.9,61):cap.set(cv2.CAP_PROP_POS_MSEC,float(t)*1000);ok,f=cap.read();assert ok;frames.append(resized(f))
 cap.release();r=experiment(name+'-video',name+' 循环影片',frames,30,{'file':'films/'+name+'.mp4','sampleCount':61,'seconds':[0,9.9],'bytes':path.stat().st_size});report['experiments'].append(r);(OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('COMPLETE',len(report['experiments']),flush=True)
