Prompt the user with an HTML form; execution pauses until the user submits or cancels.

Use only for consequential tradeoffs that genuinely require user input.
Normally act using codebase, config, docs, history, and existing conventions.
When multiple reasonable options exist, choose the conservative/standard one, proceed, and state what you chose.

<instruction>
- `html`: a single `<form>` of plain semantic HTML, rendered natively inside the terminal UI.
  - NEVER include `<script>`, `<style>`, `style=`, or submit/cancel buttons (`<button>`, `type="submit"`): the UI renders Submit and Cancel itself.
- Every form input must carry a `name`; submitted responses arrive as JSON `{"name": value}`.
- Single choice: `<input type="radio">`; multiple choice: `type="checkbox"`; long option sets: `<select>`.
- Enclose each control inside a `<label>`; wrap each question in a `<fieldset>` with a `<legend>`, or place a `<p>` immediately before the group.
- Radio and checkbox groups automatically include a free-text "Other" option. NEVER add a custom "Other" choice or extra text input for it.
- Preselect your preferred option via `checked`/`selected`/`value`: those defaults are submitted on timeout.
- Put any context required for the user's decision (findings, tradeoffs, diffs, drafts) inside the form using `<p>`, `<ul>`, `<table>`, or `<pre>`.
- Keep forms concise: a handful of questions with 2–5 choices each; defer follow-ups to a later call.
- Returned values:
  - radio group or `<select>` → selected string value
  - checkbox group (shared `name`) or `<select multiple>` → array of values
  - single checkbox or radio group left unselected → omitted
  - `type="number"` → numeric value; text inputs → string value
  - built-in "Other" text → returned as the radio value, or appended to a checkbox array
- Free-form inputs: `<input type="text|number|date|email|url">`, `<textarea>`; `placeholder`, `min`/`max`, `pattern`, and `required` attributes are honored.
- Images: `<img src="…" alt="…">` and inline `<svg>` graphics as standalone block elements.
  - `src` accepts an `http(s)` URL, `data:` URI, or working-directory-relative file path.
  - Images placed inside a `<label>` display only their `alt` text.
- Example combining context, a choice, and a numeric input:
```html
<form>
  <p>Sessions live in memory and are lost on restart.</p>
  <fieldset>
    <legend>Session store</legend>
    <label><input type="radio" name="store" value="sqlite" checked> SQLite: one file, no new service</label>
    <label><input type="radio" name="store" value="redis"> Redis: shared across instances, needs ops</label>
  </fieldset>
  <label>Session lifetime (days) <input type="number" name="ttl_days" value="30" min="1"></label>
</form>
```
</instruction>
