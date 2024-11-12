import { Base } from './base';

export class Sub extends Base {
    _bbb$ = 'hello';

    foo() {
        this._bbb$ = 'world';
        this._aaa$ = 456;
    }
}

export { Base };