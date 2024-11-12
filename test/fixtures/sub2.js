import { Base } from './base';

export class Sub2 extends Base {
    _ccc$ = 'hello2';

    foo() {
        this._ccc$ = 'world2';
        this._aaa$ = 789;
    }
}
