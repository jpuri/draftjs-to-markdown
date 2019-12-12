/**
 * Utility function to execute callback for eack key->value pair.
 */
export function forEach(obj, callback) {
  if (obj) {
    Object.keys(obj).forEach((key) => {
      // eslint-disable-line no-restricted-syntax
      if ({}.hasOwnProperty.call(obj, key)) {
        callback(key, obj[key]);
      }
    });
  }
}

/**
 * The function returns true if the string passed to it has no content.
 */
export function isEmptyString(str) {
  if (
    str === undefined
    || str === null
    || str.length === 0
    || str.trim().length === 0
  ) {
    return true;
  }
  return false;
}

/**
 * Function to check if a block is of type list.
 */
export function isList(blockType) {
  return (
    blockType === 'unordered-list-item' || blockType === 'ordered-list-item'
  );
}
