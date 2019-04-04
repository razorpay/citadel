import { fetch } from "util";

export const PENDING = 0;
export const FULFILLED = 1;
export const REJECTED = 2;

export default class BaseModel {
  constructor(data) {
    this.dataKey = "data";
    this.requestFn = fetch;
    this.data = data;

    this._state = {};
    this._listeners = [];
  }

  isPending(name) {
    return this._state[name] === PENDING;
  }

  toJSON() {
    return this[this.dataKey];
  }

  onChange(listener) {
    this._listeners.push(listener);
  }

  offChange(listener) {
    this._listeners.splice(this._listeners.indexOf(listener), 1);
  }

  setData(value) {
    this[this.dataKey] = value;
    this.emitChange();
  }

  set(name, value) {
    this[this.dataKey][name] = value;
    this.emitChange();
  }

  setState(name, value) {
    this._state[name] = value;
    this.emitChange();
  }

  emitChange() {
    if (!this._emitting) {
      this._emitting = true;
      setTimeout(() => {
        this._emitting = false;
        this._listeners.forEach(l => l());
      });
    }
  }

  request(name, promise) {
    this.setState(name, PENDING);

    return promise
      .then(data => {
        this.setState(name, FULFILLED);
        return data;
      })
      .catch(e => {
        this.setState(name, REJECTED);
        throw e;
      });
  }

  fetch() {
    return this.request("fetch", this.requestFn(this.requestOptions)).then(
      ({ data }) => {
        if (data) {
          this.setData(data);
        }
        return data;
      }
    );
  }
}
