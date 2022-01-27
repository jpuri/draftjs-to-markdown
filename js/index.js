import { isEmptyString, forEach, isList } from './common';

/**
 * Mapping block-type to corresponding markdown symbol.
 */
const defaultBlockTypesMapping = {
  unstyled: '',
  'header-one': '# ',
  'header-two': '## ',
  'header-three': '### ',
  'header-four': '#### ',
  'header-five': '##### ',
  'header-six': '###### ',
  'unordered-list-item': '- ',
  'ordered-list-item': '1. ',
  blockquote: '> ',
  code: '    ',
};

/**
 * Function to check if the block is an atomic entity block.
 */
function isAtomicBlock(block) {
  if (block.entityRanges.length > 0 && isEmptyString(block.text)) {
    return true;
  }
  return false;
}

/**
 * Function will return markdown for Entity.
 */
function getEntityMarkdown(entityMap, entityKey, text, customEntityTransform) {
  const entity = entityMap[entityKey];
  if (typeof customEntityTransform === 'function') {
    const html = customEntityTransform(entity, text);
    if (html) {
      return html;
    }
  }
  if (entity.type === 'MENTION') {
    return `[${text}](${entity.data.url})`;
  }
  if (entity.type === 'LINK') {
    return `[${text}](${entity.data.url})`;
  }
  if (entity.type === 'IMAGE') {
    return `![${entity.data.alt || ''}](${entity.data.src})`;
  }
  if (entity.type === 'EMBEDDED_LINK') {
    return `<iframe width="${entity.data.width}" height="${entity.data.height}" src="${entity.data.src}" frameBorder="0" allowFullScreen />`;
  }
  return text;
}

/**
 * The function returns an array of hashtag-sections in blocks.
 * These will be areas in block which have hashtags applicable to them.
 */
function getHashtagRanges(blockText, hashConfig) {
  const sections = [];
  if (hashConfig) {
    let counter = 0;
    let startIndex = 0;
    let text = blockText;
    const trigger = hashConfig.trigger || '#';
    const separator = hashConfig.separator || ' ';
    for (; text.length > 0 && startIndex >= 0;) {
      if (text[0] === trigger) {
        startIndex = 0;
        counter = 0;
        text = text.substr(trigger.length);
      } else {
        startIndex = text.indexOf(separator + trigger);
        if (startIndex >= 0) {
          text = text.substr(startIndex + (separator + trigger).length);
          counter += startIndex + separator.length;
        }
      }
      if (startIndex >= 0) {
        const endIndex =          text.indexOf(separator) >= 0 ? text.indexOf(separator) : text.length;
        const hashtagText = text.substr(0, endIndex);
        if (hashtagText && hashtagText.length > 0) {
          sections.push({
            offset: counter,
            length: hashtagText.length + trigger.length,
            type: 'HASHTAG',
          });
        }
        counter += trigger.length;
      }
    }
  }
  return sections;
}

/**
 * The function returns an array of entity-sections in blocks.
 * These will be areas in block which have same entity or no entity applicable to them.
 */
function getSections(block, hashConfig) {
  const sections = [];
  let lastOffset = 0;
  let sectionRanges = block.entityRanges.map((range) => {
    const { offset, length, key } = range;
    return {
      offset,
      length,
      key,
      type: 'ENTITY',
    };
  });
  sectionRanges = sectionRanges.concat(
    getHashtagRanges(block.text, hashConfig),
  );
  sectionRanges = sectionRanges.sort((s1, s2) => s1.offset - s2.offset);
  sectionRanges.forEach((r) => {
    if (r.offset > lastOffset) {
      sections.push({
        start: lastOffset,
        end: r.offset - 1,
      });
    }
    sections.push({
      start: r.offset,
      end: r.offset + r.length,
      entityKey: r.key,
      type: r.type,
    });
    lastOffset = r.offset + r.length;
  });
  if (lastOffset < block.text.length) {
    sections.push({
      start: lastOffset,
      end: block.text.length,
    });
  }
  return sections;
}

/**
 * The function will return array of inline styles applicable to the block.
 */
function getStyleArrayForBlock(block) {
  const { text, inlineStyleRanges } = block;
  const inlineStyles = {
    COLOR: new Array(text.length),
    BGCOLOR: new Array(text.length),
    FONTSIZE: new Array(text.length),
    FONTFAMILY: new Array(text.length),
    SUBSCRIPT: new Array(text.length),
    SUPERSCRIPT: new Array(text.length),
    CODE: new Array(text.length),
    STRIKETHROUGH: new Array(text.length),
    UNDERLINE: new Array(text.length),
    ITALIC: new Array(text.length),
    BOLD: new Array(text.length),
    length: text.length,
  };
  if (inlineStyleRanges && inlineStyleRanges.length > 0) {
    inlineStyleRanges.forEach((range) => {
      const { offset } = range;
      const length = offset + range.length;
      for (let i = offset; i < length; i += 1) {
        if (range.style.indexOf('color-') === 0) {
          inlineStyles.COLOR[i] = range.style.substring(6);
        } else if (range.style.indexOf('bgcolor-') === 0) {
          inlineStyles.BGCOLOR[i] = range.style.substring(8);
        } else if (range.style.indexOf('fontsize-') === 0) {
          inlineStyles.FONTSIZE[i] = range.style.substring(9);
        } else if (range.style.indexOf('fontfamily-') === 0) {
          inlineStyles.FONTFAMILY[i] = range.style.substring(11);
        } else if (inlineStyles[range.style]) {
          inlineStyles[range.style][i] = true;
        }
      }
    });
  }
  return inlineStyles;
}

/**
 * Function returns true for a set of styles if the value of these styles at an offset
 * are same as that on the previous offset.
 */
export function sameStyleAsPrevious(inlineStyles, styles, index) {
  let sameStyled = true;
  if (index > 0 && index < inlineStyles.length) {
    styles.forEach((style) => {
      sameStyled =        sameStyled
        && inlineStyles[style][index] === inlineStyles[style][index - 1];
    });
  } else {
    sameStyled = false;
  }
  return sameStyled;
}

/**
 * The function will return inline style applicable at some offset within a block.
 */
export function getStylesAtOffset(inlineStyles, offset) {
  const styles = {};
  if (inlineStyles.COLOR[offset]) {
    styles.COLOR = inlineStyles.COLOR[offset];
  }
  if (inlineStyles.BGCOLOR[offset]) {
    styles.BGCOLOR = inlineStyles.BGCOLOR[offset];
  }
  if (inlineStyles.FONTSIZE[offset]) {
    styles.FONTSIZE = inlineStyles.FONTSIZE[offset];
  }
  if (inlineStyles.FONTFAMILY[offset]) {
    styles.FONTFAMILY = inlineStyles.FONTFAMILY[offset];
  }
  if (inlineStyles.SUBSCRIPT[offset]) {
    styles.SUBSCRIPT = true;
  }
  if (inlineStyles.SUPERSCRIPT[offset]) {
    styles.SUPERSCRIPT = true;
  }
  if (inlineStyles.CODE[offset]) {
    styles.CODE = true;
  }
  if (inlineStyles.STRIKETHROUGH[offset]) {
    styles.STRIKETHROUGH = true;
  }
  if (inlineStyles.UNDERLINE[offset]) {
    styles.UNDERLINE = true;
  }
  if (inlineStyles.ITALIC[offset]) {
    styles.ITALIC = true;
  }
  if (inlineStyles.BOLD[offset]) {
    styles.BOLD = true;
  }
  return styles;
}

/**
 * For a given section in a block the function will return a further list of sections,
 * with similar inline styles applicable to them.
 */
function getStyleSections(block, styles, start, end) {
  const styleSections = [];
  const { text } = block;
  if (text.length > 0) {
    const inlineStyles = getStyleArrayForBlock(block);
    let section;
    for (let i = start; i < end; i += 1) {
      if (i !== start && sameStyleAsPrevious(inlineStyles, styles, i)) {
        // $FlowFixMe
        section.text.push(text[i]);
        // $FlowFixMe
        section.end = i + 1;
      } else {
        section = {
          styles: getStylesAtOffset(inlineStyles, i),
          text: [text[i]],
          start: i,
          end: i + 1,
        };
        styleSections.push(section);
      }
    }
  }
  return styleSections;
}

/**
 * The function returns text for given section of block after doing required character replacements.
 */
function getSectionText(text) {
  if (text && text.length > 0) {
    const chars = text.map((ch) => {
      switch (ch) {
        case '\n':
          return '\\s\\s\n';
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        default:
          return ch;
      }
    });
    return chars.join('');
  }
  return '';
}

/**
 * Function that fixes incorrect lenght to applied styles and emoji break #10
 */
function fixStyle(content, style) {
  const fixes = {
    bold: ['**', '**'],
    italic: ['*', '*'],
    underline: ['__', '__'],
    strikethrough: ['~~', '~~'],
    code: ['\`', '\`'],
    superscript: ['<sup>', '</sup>'],
    subscript: ['<sub>', '</sub>']
  }

  const regexEmoji = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
  const hasEmoji = regexEmoji.test(content)

  if (hasEmoji) {   
    return content.replace(/\__|\*\*|\*|~~|\`|\<sup\>|\<\/sup\>|\<sub\>|\<\/sub\>/gi, '')
  }

  const firstLetter = content.charAt(0);
  const lastLetter = content.charAt(content.length - 1);

  const trimmed = content.trim()

  if (firstLetter === ' ') {
    return ` ${fixes[style][0]}${trimmed}${fixes[style][1]}`
  } else if (lastLetter === ' ') {
    return `${fixes[style][0]}${trimmed}${fixes[style][1]} `
  } else if (firstLetter === ' ' && lastLetter === ' ') {
    return ` ${fixes[style][0]}${trimmed}${fixes[style][1]} `
  } else {
    return `${fixes[style][0]}${content}${fixes[style][1]}`
  }
}

/**
 * Function returns markdown for inline style symbols.
 */
export function addInlineStyleMarkdown(style, content) {
  if (style === 'BOLD') {
    return fixStyle(content, 'bold');
  }
  if (style === 'ITALIC') {
    return fixStyle(content, 'italic');
  }
  if (style === 'UNDERLINE') {
    return fixStyle(content, 'underline');
  }
  if (style === 'STRIKETHROUGH') {
    return fixStyle(content, 'strikethrough');
  }
  if (style === 'CODE') {
    return fixStyle(content, 'code')
  }
  if (style === 'SUPERSCRIPT') {
    return fixStyle(content, 'superscript')
  }
  if (style === 'SUBSCRIPT') {
    return fixStyle(content, 'subscript')
  }
  return content;
}

/**
 * The method returns markup for section to which inline styles
 * BOLD, UNDERLINE, ITALIC, STRIKETHROUGH, CODE, SUPERSCRIPT, SUBSCRIPT are applicable.
 */
function getStyleTagSectionMarkdown(styles, text) {
  let content = text;
  forEach(styles, (style, value) => {
    content = addInlineStyleMarkdown(style, content, value);
  });
  return content;
}

/**
 * Function returns html for text applying inline style in styles property in a span.
 */
export function addStylePropertyMarkdown(styleSection) {
  const { styles, text } = styleSection;
  const content = getSectionText(text);
  if (
    styles
    && (styles.COLOR || styles.BGCOLOR || styles.FONTSIZE || styles.FONTFAMILY)
  ) {
    let styleString = 'style="';
    if (styles.COLOR) {
      styleString += `color: ${styles.COLOR};`;
    }
    if (styles.BGCOLOR) {
      styleString += `background-color: ${styles.BGCOLOR};`;
    }
    if (styles.FONTSIZE) {
      styleString += `font-size: ${styles.FONTSIZE}px;`;
    }
    if (styles.FONTFAMILY) {
      styleString += `font-family: ${styles.FONTFAMILY};`;
    }
    styleString += '"';
    return `<span ${styleString}>${content}</span>`;
  }
  return content;
}

/**
 * The method returns markdown for an entity section.
 * An entity section is a continuous section in a block
 * to which same entity or no entity is applicable.
 */
function getSectionMarkdown(block, entityMap, section, customEntityTransform) {
  const entitySectionMarkdown = [];
  const styleSections = getStyleSections(
    block,
    [
      'BOLD',
      'ITALIC',
      'UNDERLINE',
      'STRIKETHROUGH',
      'CODE',
      'SUPERSCRIPT',
      'SUBSCRIPT',
    ],
    section.start,
    section.end,
  );
  let styleSectionText = '';
  styleSections.forEach((styleSection) => {
    const stylePropertySections = getStyleSections(
      block,
      ['COLOR', 'BGCOLOR', 'FONTSIZE', 'FONTFAMILY'],
      styleSection.start,
      styleSection.end,
    );
    let stylePropertySectionText = '';
    stylePropertySections.forEach((stylePropertySection) => {
      stylePropertySectionText += addStylePropertyMarkdown(
        stylePropertySection,
      );
    });
    styleSectionText += getStyleTagSectionMarkdown(
      styleSection.styles,
      stylePropertySectionText,
    );
  });
  entitySectionMarkdown.push(styleSectionText);
  let sectionText = entitySectionMarkdown.join('');
  if (section.type === 'ENTITY') {
    if (section.entityKey !== undefined && section.entityKey !== null) {
      sectionText = getEntityMarkdown(
        entityMap,
        section.entityKey,
        sectionText,
        customEntityTransform,
      );
    }
  } else if (section.type === 'HASHTAG') {
    sectionText = `[${sectionText}](${sectionText})`;
  }
  return sectionText;
}

/**
 * Replace leading blank spaces by &nbsp;
 */
export function trimLeadingZeros(sectionText) {
  if (sectionText) {
    let replacedText = sectionText;
    for (let i = 0; i < replacedText.length; i += 1) {
      if (sectionText[i] === ' ') {
        replacedText = replacedText.replace(' ', '&nbsp;');
      } else {
        break;
      }
    }
    return replacedText;
  }
  return sectionText;
}

/**
 * Replace trailing blank spaces by &nbsp;
 */
export function trimTrailingZeros(sectionText) {
  if (sectionText) {
    let replacedText = sectionText;
    for (let i = replacedText.length - 1; i >= 0; i -= 1) {
      if (replacedText[i] === ' ') {
        replacedText = `${replacedText.substring(
          0,
          i,
        )}&nbsp;${replacedText.substring(i + 1)}`;
      } else {
        break;
      }
    }
    return replacedText;
  }
  return sectionText;
}

/**
 * Function will return the markdown for block content.
 */
export function getBlockContentMarkdown(
  block,
  entityMap,
  hashConfig,
  customEntityTransform,
) {
  if (isAtomicBlock(block)) {
    return getEntityMarkdown(
      entityMap,
      block.entityRanges[0].key,
      undefined,
      customEntityTransform,
    );
  }
  const blockMarkdown = [];
  const entitySections = getSections(block, hashConfig);
  entitySections.forEach((section, index) => {
    let sectionText = getSectionMarkdown(
      block,
      entityMap,
      section,
      customEntityTransform,
    );
    if (index === 0) {
      sectionText = trimLeadingZeros(sectionText);
    }
    if (index === entitySections.length - 1) {
      sectionText = trimTrailingZeros(sectionText);
    }
    blockMarkdown.push(sectionText);
  });
  return blockMarkdown.join('');
}

/**
 * Function will return style string for a block.
 */
export function getBlockStyle(data) {
  let styles = '';
  forEach(data, (key, value) => {
    styles += `${key}:${value};`;
  });
  return styles;
}

/**
 * FUnciton will add <span> with style property aroung block content for block level text-styling.
 */
function getBlockStyleProperty(blockData, content) {
  const blockStyle = getBlockStyle(blockData);
  if (blockStyle) {
    return `<span style="${blockStyle}">${content}</span>`;
  }
  return content;
}

/**
 * Function will return markdown for the block.
 */
function getBlockMarkdown(
  block,
  blockTypesMapping,
  entityMap,
  hashConfig,
  customEntityTransform,
  config,
) {
  const blockMarkdown = [];
  blockMarkdown.push(blockTypesMapping[block.type]);
  let blockContentMarkdown = getBlockContentMarkdown(
    block,
    entityMap,
    hashConfig,
    customEntityTransform,
  );
  if (block.data) {
    blockContentMarkdown = getBlockStyleProperty(
      block.data,
      blockContentMarkdown,
    );
  }
  blockMarkdown.push(blockContentMarkdown);
  blockMarkdown.push(config && config.emptyLineBeforeBlock ? '\n\n' : '\n');
  return blockMarkdown.join('');
}

function getDepthPadding(depth) {
  let padding = '';
  for (let i = 0; i < depth * 4; i += 1) {
    padding += ' ';
  }
  return padding;
}

/**
 * The function will generate markdown for given draftjs editorContent.
 */
export default function draftToMarkdown(
  editorContent,
  hashConfig,
  customEntityTransform,
  config,
) {
  const markdown = [];
  if (editorContent) {
    const blockTypesMapping = {
      ...defaultBlockTypesMapping,
      ...(config && config.blockTypesMapping && config.blockTypesMapping),
    };
    const { blocks, entityMap } = editorContent;
    if (blocks && blocks.length > 0) {
      blocks.forEach((block) => {
        let content = getBlockMarkdown(
          block,
          blockTypesMapping,
          entityMap,
          hashConfig,
          customEntityTransform,
          config,
        );
        if (isList(block.type)) {
          content = getDepthPadding(block.depth) + content;
        }
        markdown.push(content);
      });
    }
  }
  return markdown.join('');
}
