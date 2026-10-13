---
feature: File input
status: implemented
authored: planned
---

# File input

## Goal
A user picks or drops a file, such as a bank statement to import, and the app gets its content straight away in the browser without uploading it anywhere, while the input still takes part in its form like any native input.

## Reading a chosen file
- **Native picker**: choosing a file opens the browser's native file picker (docs/authoring/DesignLanguage.md#Native First)
- **Form value**: the chosen file is the input's value in its form, so the form's data holds the file itself (docs/authoring/DesignLanguage.md#Native First)
  - **Required without a file**: with `required` set and no file chosen, the form fails the browser's validation
  - **Form reset**: resetting the form clears the chosen file
- **Accepted types**: the page can limit the picker to given file types
  - **Type refused**: a file of another type that still gets through fires the error event and is not read
- **Read in the browser**: reading a file makes no network request
- **Content event**: once read, the input fires an `r-` event, carried by a typed event, with the file's name, type and content (docs/authoring/ComponentContract.md#Naming)
  - **Same file again**: choosing the file already chosen reads it again and fires the event again
  - **Picker cancelled**: closing the picker without choosing fires nothing and keeps the file already chosen
- **Text or bytes**: the content is text by default, and the page can ask for the raw bytes instead
  - **Unknown read mode**: a read mode other than text or bytes logs an error naming the tag and the input renders empty (docs/authoring/ComponentContract.md#Failing Loudly)
- **Text encoding**: text is read as UTF-8 unless the page names another encoding, such as `windows-1252`
  - **Unknown encoding**: an encoding the browser does not know logs an error naming the tag and the input renders empty (docs/authoring/ComponentContract.md#Failing Loudly)
- **Several files**: with `multiple` set the user can choose several files, and the input fires one content event per file
- **Size limit**: with `max-size` set, a file larger than that many bytes fires the error event and is not read
  - **No limit**: without `max-size` any size is read
- **Read failure**: a file that cannot be read fires an error event naming the file and logs the error

## Dropping a file
- **Drop to read**: a file dropped on the input is handled exactly as if it had been chosen in the picker
  - **Several dropped without multiple**: dropping more than one file on an input without `multiple` fires the error event and reads none of them
- **Drop highlight**: while a file is dragged over the input it is marked as a drop target, reflected as an attribute (docs/authoring/ComponentContract.md#State in the DOM)
  - **Drag leaves**: the mark goes when the file is dragged away or dropped

## Seeing the chosen file
- **Button text**: the input's words come from the `r-components` namespace (docs/authoring/TextAndValues.md#Words)
- **Chosen name shown**: the chosen file's name is shown exactly as given (docs/authoring/TextAndValues.md#Data Is Shown as Given)
- **Reading state**: while a file is being read the input carries `loading` and `aria-busy` (docs/authoring/ComponentContract.md#State in the DOM)
- **Disabled**: an input in a disabled form or fieldset cannot be chosen or dropped on
