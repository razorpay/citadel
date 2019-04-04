import isEmpty from "lodash/isEmpty";

const ValidationHelper = {
  /**
   * Returns true if given variable is undefined
   * @param value
   * @returns {boolean}
   */
  isUndefined: value => {
    return typeof value === "undefined";
  },
  /**
   * Returns true if given variable is empty
   * @param value
   * @returns {boolean}
   */
  isEmpty: value => {
    return (
      !ValidationHelper.isNumber(value) &&
      isEmpty(value) &&
      !ValidationHelper.isDate(value)
    );
  },
  /**
   * Returns true if given variable is string
   * @param value
   * @returns {boolean}
   */
  isString: value => {
    return typeof value === "string" || value instanceof String;
  },

  /**
   * Returns true if given variable is number
   * @param value
   * @returns {boolean}
   */
  isNumber: value => {
    return (
      (typeof value === "number" || value instanceof Number) && !isNaN(value)
    );
  },

  /**
   * Returns true if given variable is boolean
   * @param value
   */
  isBoolean: value => {
    return typeof value === "boolean" || value instanceof Boolean;
  },

  /**
   * Returns true if given variable is object
   * @param object Object to be checked
   * @param className Check for instance of a particular class
   * @returns {boolean}
   */
  isObject: (object, className = Object) => {
    return object instanceof className;
  },

  /**
   * Returns true if given variable is Date object
   * @param object Object to be checked
   * @returns {boolean}
   */
  isDate: object => {
    return (
      object instanceof Date && ValidationHelper.isNumber(object.getTime())
    );
  },

  /**
   * Returns true if given variable is array
   * @param value - Array to be checked
   * @returns {boolean}
   */
  isArray: value => {
    return value instanceof Array;
  },

  isFunction: func => {
    return typeof func === "function" || func instanceof Function;
  }
};

export default ValidationHelper;
