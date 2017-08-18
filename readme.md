# DraftJS TO Markdown

A library for converting DraftJS editor content to markdown.

This is draft to markdown library I wrote for one of my projects. I am open-sourcing it so that others can also be benefitted from my work.

## Installation

`npm install draftjs-to-markdown`

## Usage

```
import draftToMarkdown from 'draftjs-to-markdown';
import { convertToRaw } from 'draft-js;

const rawContentState = convertToRaw(editorState.getCurrentContent());
const markup = draftToMarkdown(contentState, hashConfig, customEntityTransform, config);
```
The function parameters are:

1. **contentState**: Its instance of  [RawDraftContentState](https://facebook.github.io/draft-js/docs/api-reference-data-conversion.html#content)

2. **hashConfig**: Its configuration object for hashtag, its required only if hashtags are used. If the object is not defined hashtags will be output as simple text in the markdown.
    ```
    hashConfig = {
      trigger: '#',
      separator: ' ',
    }
    ```
    Here trigger is character that marks starting of hashtag (default '#') and separator is character that separates characters (default ' '). These fields are optional.

3. **customEntityTransform**: Its function to render custom defined entities by user, its also optional.

4. **config**: Object to pass configuration options.
    ```
    {
      blockTypesMapping : {/* mappings */},
      emptyLineBeforeBlock : true
    }
    ```
    blockTypesMapping overrides the default markdown syntax. For example, to use an asterisk rather than a dash for unordered-list-item:
    ```
    {
      blockTypesMapping : {
        'unordered-list-item': '* '
      }
    }
    ```
    By default only one line break is added before a block. Pass ```emptyLineBeforeBlock: true``` to add two line breaks before every block.

   **editorState** is instance of DraftJS               [EditorState](https://draftjs.org/docs/api-reference-editor-state.html#content).


## Supported conversions
Following is the list of conversions it supports:

1. Convert block types to corresponding markdown syntax:

    || Block Type | Markdown |
    | -------- | -------- | -------- |
    | 1 | header-one | `#` |
    | 2 | header-two | `##` |
    | 3 | header-three | `###` |
    | 4 | header-four | `####` |
    | 5 | header-five | `#####` |
    | 6 | header-six | `######` |
    | 7 | unordered-list-item | `-` |
    | 8 | ordered-list-item | `1.` |
    | 9 | blockquote | `>` |
    | 10 | code | `    ` |
    | 11 | unstyled | `` |

    It performs these additional changes to text of blocks:
    - replace blank space in beginning and end of block with `&nbsp;`
    - replace `\n` with `\s\s\n`
    - replace `<` with `&lt;`
    - replace `>` with `&gt;`

2. Ordered and unordered list blocks with depths are appended with 4 blank spaces.

3. Converts inline styles BOLD, ITALIC, UNDERLINE, STRIKETHROUGH, CODE, SUPERSCRIPT, SUBSCRIPT to corresponding markdown syntax: `**, *, __, ~~, ``, <sup>, <sub>`.

4. Converts inline styles color, background-color, font-size, font-family to a span tag with inline style details:
`<span style="color:xyz;font-size:xx">`. (In the input JSON, inline styles should start with strings `color` or `font-size` like `color-red`, `color-green` or `fontsize-12`, `fontsize-20`).

5. Converts entity range of type link to :`[Link Text](Link URL)`.

6. Converts hashtags to :`[hashtag](hashtag)`.

7. Converts atomic entity image to image tag using entity data src for image source: `![alt text](Image Source)`.

8. Converts embedded links to HTML iframe tags `<iframe ... />`.

9. For block level styles like text-alignment add `<span>` with `style` property around block content.

10. Supports using function `customEntityTransform` for custom draftjs entities. If present its call to generate markdown for entity. It can take 2 parameter:
   1. `entity` ( object with { type, mutalibity, data})
   2. `text` text present in the block.

## License
MIT.
