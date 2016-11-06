/* @flow */

/**
* Utility function to execute callback for eack key->value pair.
*/
export function forEach(obj: Object, callback: Function) {
  if (obj) {
    for (const key in obj) { // eslint-disable-line no-restricted-syntax
      if ({}.hasOwnProperty.call(obj, key)) {
        callback(key, obj[key]);
      }
    }
  }
}

/**
* The function returns true if the string passed to it has no content.
*/
export function isEmptyString(str: string): boolean {
  if (str === undefined || str === null || str.length === 0 || str.trim().length === 0) {
    return true;
  }
  return false;
}

/**
* Function to check if a block is of type list.
*/
export function isList(blockType: string): any {
  return (
    blockType === 'unordered-list-item' ||
    blockType === 'ordered-list-item'
  );
}
