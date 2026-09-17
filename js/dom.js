// Tiny DOM helper. No framework, no innerHTML.
//
// h(tag, attrs, ...children)
//   attrs: null/{} or a plain object. Recognised keys:
//     - class            -> element.className
//     - text             -> element.textContent (use instead of children for plain text)
//     - on<Event>         (function) -> addEventListener(event, fn)
//     - anything else (aria-*, data-*, role, type, tabindex, style, href, ...) -> setAttribute
//     - value === true   -> setAttribute(key, '') (boolean attribute)
//     - value == null or === false -> attribute skipped
//   "html" is deliberately not supported: this helper never injects raw HTML.
//   children: strings/numbers (-> text nodes), Nodes, arrays (flattened), null/false (skipped).
//
// fill(template, values) replaces {key} placeholders in a copy string.
// clear(el) removes all children of el.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === 'class') {
        el.className = value;
      } else if (key === 'text') {
        el.textContent = value;
      } else if (key.startsWith('on') && key.length > 2 && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) {
        el.setAttribute(key, '');
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }

  const append = (child) => {
    if (child == null || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(append);
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(String(child)));
    }
  };
  children.forEach(append);

  return el;
}

export function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (
    values && Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
