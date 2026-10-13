# File Input

A file picker that reads the chosen file in the browser, without uploading it, and still takes part in its form like a native input, such as a bank statement to import.

## Screenshots

<!-- screenshots: r-file-input -->
<!-- /screenshots -->

## Usage

```html
<form>
    <r-file-input name="statement" accept=".csv" read-as="text" encoding="windows-1252" max-size="1000000" required></r-file-input>
</form>
```

```typescript
const input = document.querySelector('r-file-input')!;
input.addEventListener('r-file-read', (event) => importStatement(event.name, event.content as string));
input.addEventListener('r-file-error', (event) => showProblem(event.name, event.reason));
```

- The button opens the browser's native file picker; a file dropped on the input is handled exactly as one chosen in the picker. While a file is dragged over it, the input carries `drop-target`.
- Reading makes no network request. Choosing the same file again reads it again; closing the picker without choosing keeps the file already chosen.
- With `multiple`, one `r-file-read` is dispatched per file. Dropping several files on an input without `multiple` dispatches `r-file-error` and reads none.
- A file of a type `accept` does not allow, or larger than `max-size`, dispatches `r-file-error` and is not read. A file that cannot be read dispatches `r-file-error` and reports the error.
- The chosen file is the input's value in its form. With `required` and no file the form fails validation; resetting the form clears the file. An input in a disabled form or fieldset cannot be chosen or dropped on.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | | Name of the value in the form |
| `accept` | `string` | | File types the picker offers, as on a native file input |
| `multiple` | `boolean` | | Lets the user choose several files |
| `required` | `boolean` | | The form fails validation until a file is chosen |
| `read-as` | `text \| bytes` | `text` | The content as a string, or as an `ArrayBuffer` |
| `encoding` | `string` | `utf-8` | Encoding of text content, such as `windows-1252` |
| `max-size` | `number` | | Largest file in bytes that is read |

A `read-as` other than `text` or `bytes`, an encoding the browser does not know, or a `max-size` that is not a number of bytes reports an error and the input renders empty.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `files` | `readonly File[]` (read only) | The files currently chosen |

## Events

### r-file-read

Dispatched as `FileReadEvent` once a chosen file has been read. Bubbles.

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | The file's name, as given |
| `mimeType` | `string` | The file's MIME type, empty when the browser does not know it |
| `content` | `string \| ArrayBuffer` | A string with `read-as="text"`, an `ArrayBuffer` with `bytes` |

### r-file-error

Dispatched as `FileErrorEvent` when a file is refused or cannot be read. Bubbles.

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | The file the error is about |
| `reason` | `string` | What went wrong |

## Parts

| Selector | What it is |
|----------|------------|
| `r-file-input button` | The button that opens the picker, worded with the `chooseFile` or `chooseFiles` text from the [`r-components` namespace](../Formatting.md#words) |
| `r-file-input .chosen-name` | The chosen file's name, shown as given |
| `r-file-input[drop-target]` | While a file is dragged over the input |
| `r-file-input[loading]` | While a file is read; it also carries `aria-busy` |
