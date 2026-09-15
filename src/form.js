/** Both cinematic and static forms use this same submission behavior. */
export function installLocalForm(root = document) {
  for (const form of root.querySelectorAll("form[data-local-form]")) {
    if (form.dataset.bound) return;
    form.dataset.bound = "true";
    let pending = false,
      complete = false,
      requestId = crypto.randomUUID();
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('[role="status"]');
    const original = button.textContent;
    button.disabled = false;
    button.addEventListener("pointerdown", (event) =>
      button.setPointerCapture(event.pointerId),
    );
    form.addEventListener(
      "invalid",
      (event) => {
        event.preventDefault();
        const first = form.querySelector("input:invalid,textarea:invalid");
        if (first) {
          first.focus({ preventScroll: true });
          status.dataset.state = "error";
          status.textContent = first.validationMessage;
        }
      },
      true,
    );
    if (form.classList.contains("cf-in"))
      form.addEventListener("pointerdown", (event) => {
        // Perspective + translateZ can leave a visual control above its planar hit target.
        // Preserve the reference's geometric hit handling while using native form semantics.
        if (event.target.closest("input,textarea,button")) return;
        for (const control of form.querySelectorAll(".cf-f,.cf-cta")) {
          const rect = control.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            continue;
          event.preventDefault();
          const field = control.querySelector("input,textarea");
          if (field) field.focus({ preventScroll: true });
          else form.requestSubmit(button);
          break;
        }
      });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (pending || complete) return;
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const payload = {
        requestId,
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        message: String(data.get("message") || "").trim(),
      };
      if (!payload.name || !payload.message) {
        status.textContent = "Please complete all fields.";
        return;
      }
      pending = true;
      button.disabled = true;
      form.setAttribute("aria-busy", "true");
      button.textContent = "Sending…";
      status.textContent = "";
      try {
        const response = await fetch("/api/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000),
        });
        const result = await response.json();
        if (
          !response.ok ||
          !result.ok ||
          !result.receiptId ||
          result.destination !== "local-review"
        )
          throw new Error(result.error || "invalid_receipt");
        complete = true;
        button.textContent = "Received locally";
        status.dataset.state = "success";
        status.textContent =
          "Saved to the local review inbox. Nothing was sent to Pear.";
        form.dataset.receipt = result.receiptId;
        for (const field of form.querySelectorAll("input,textarea"))
          field.readOnly = true;
      } catch (error) {
        button.textContent = original;
        button.disabled = false;
        status.dataset.state = "error";
        status.textContent =
          "Receipt not confirmed. Please try again; your text is still here.";
        if (error.message === "request_id_conflict")
          requestId = crypto.randomUUID();
      } finally {
        pending = false;
        form.removeAttribute("aria-busy");
      }
    });
  }
}
