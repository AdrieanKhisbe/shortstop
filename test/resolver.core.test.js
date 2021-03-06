const test = require('ava');
const _ = require('lodash/fp');
const {Resolver} = require('..');

function foo(input) {
  return `${input}_foo`;
}
function bar(input) {
  return `${input}_bar`;
}

test('resolver', t => {
  const resolver = new Resolver();
  t.is(typeof resolver, 'object');

  t.true(_.isFunction(resolver.use), 'use is not a function');
  t.true(_.isFunction(resolver.resolve), 'resolve is not a function');
  t.true(_.isFunction(resolver.resolveFile), 'resolveFile is not a function');
});

test('resolver with parent', t => {
  const parent = new Resolver();
  const resolver = new Resolver(parent);
  t.is(typeof resolver, 'object');
  t.is(resolver.parent, parent);
});

test('resolver with parent and handlers', t => {
  const parent = new Resolver();
  const resolver = new Resolver(parent, {foo});
  t.is(typeof resolver, 'object');
  t.is(resolver.parent, parent);
  t.is(Object.keys(resolver._handlers).length, 1);
  t.is(resolver._handlers.foo.length, 1);
});

test('resolver with handlers also', t => {
  const resolver = new Resolver({foo});
  t.is(typeof resolver, 'object');
  t.is(Object.keys(resolver._handlers).length, 1);
  t.is(resolver._handlers.foo.length, 1);
});

test('use', t => {
  const resolver = new Resolver();
  const unsubscriber = resolver.use('foo', foo);

  t.is(typeof resolver._handlers['foo'], 'object');
  t.is(resolver._handlers['foo'].length, 1);
  t.true(_.isFunction(unsubscriber));
});

test('use with object', t => {
  const resolver = new Resolver();
  const unsuscribers = resolver.use({foo, bar});

  t.is(typeof resolver._handlers['foo'], 'object');
  t.is(resolver._handlers['foo'].length, 1);
  t.is(typeof resolver._handlers['bar'], 'object');
  t.is(resolver._handlers['bar'].length, 1);
  t.true(_.isPlainObject(unsuscribers));
  t.true(_.isFunction(unsuscribers.foo));
  t.true(_.isFunction(unsuscribers.bar));
});

test('use with object and array', t => {
  const resolver = new Resolver();
  const unsuscribers = resolver.use({foo: [foo, foo]});

  t.is(typeof resolver._handlers['foo'], 'object');
  t.is(resolver._handlers['foo'].length, 2);
  t.assert(_.isPlainObject(unsuscribers) && unsuscribers.foo.length === 2);
});

test('use with array of handlers', t => {
  const resolver = new Resolver();
  const unsuscribers = resolver.use('foobar', [foo, bar]);

  t.is(typeof resolver._handlers['foobar'], 'object');
  t.is(resolver._handlers['foobar'].length, 2);
  t.true(unsuscribers && unsuscribers.length === 2);
});

test('unuse', t => {
  function handlerA() {
    // noop
  }

  function handlerB() {
    // noop
  }

  function handlerC() {
    // noop
  }

  const resolver = new Resolver();
  const unuseA = resolver.use('handlerA', handlerA);
  const unuseB = resolver.use('handlerB', handlerB);
  const unuseC = resolver.use('handlerC', handlerC);

  t.assert(_.isFunction(unuseA));
  t.assert(_.isFunction(unuseB));
  t.assert(_.isFunction(unuseC));

  t.is(typeof resolver._handlers['handlerA'], 'object');
  t.is(typeof resolver._handlers['handlerB'], 'object');
  t.is(typeof resolver._handlers['handlerC'], 'object');

  t.is(resolver._handlers['handlerA'].length, 1);
  t.is(resolver._handlers['handlerB'].length, 1);
  t.is(resolver._handlers['handlerC'].length, 1);

  unuseA();

  t.is(resolver._handlers['handlerA'].length, 0);
  t.is(resolver._handlers['handlerB'].length, 1);
  t.is(resolver._handlers['handlerC'].length, 1);

  unuseC();

  t.is(resolver._handlers['handlerA'].length, 0);
  t.is(resolver._handlers['handlerB'].length, 1);
  t.is(resolver._handlers['handlerC'].length, 0);

  unuseB();

  t.is(resolver._handlers['handlerA'].length, 0);
  t.is(resolver._handlers['handlerB'].length, 0);
  t.is(resolver._handlers['handlerC'].length, 0);
});

test('unuse stack', t => {
  const name = 'custom';
  function customA() {
    // noop
  }

  function customB() {
    // noop
  }

  function customC() {
    // noop
  }

  const resolver = new Resolver();
  const unuseA = resolver.use(name, customA);
  const unuseB = resolver.use(name, customB);
  const unuseC = resolver.use(name, customC);

  t.assert(_.isFunction(unuseA));
  t.assert(_.isFunction(unuseB));
  t.assert(_.isFunction(unuseC));

  t.is(typeof resolver._handlers[name], 'object');
  t.is(resolver._handlers[name].length, 3);

  const removedA = unuseA();
  t.is(removedA, customA);
  t.is(`${name}A`, customA.name);
  t.is(resolver._handlers[name].length, 2);

  t.is(unuseA(), undefined);

  const removedB = unuseB();
  t.is(removedB, customB);
  t.is(`${name}B`, customB.name);
  t.is(resolver._handlers[name].length, 1);

  const removedC = unuseC();
  t.is(removedC, customC);
  t.is(`${name}C`, customC.name);
  t.is(resolver._handlers[name].length, 0);
});
