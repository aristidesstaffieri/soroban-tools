import test from 'ava'
import { root, rpcUrl, wallet } from './util.js'
import { Contract, networks } from 'test-custom-types'

const addr = root.address;

const contract = new Contract({ ...networks.standalone, rpcUrl, wallet });

test('hello', async t => {
  t.is((await contract.hello({ hello: 'tests' })).result, 'tests')
})

test('woid', async t => {
  t.is((await contract.woid()).result, undefined)
})

// Bug in soroban client, will be fixed in next release
// test('u32_fail_on_even', async t => {
//   t.deepEqual((await contract.u32FailOnEven({ u32_: 1 })).result, new Ok(1))
//   t.deepEqual((await contract.u32FailOnEven({ u32_: 0 })).result, new Err({ message: "Please provide an odd number" }))
// })

test('u32', async t => {
  t.is((await contract.u32({ u32_: 1 })).result, 1)
})

test('i32', async t => {
  t.is((await contract.i32({ i32_: 1 })).result, 1)
})

test('i64', async t => {
  t.is((await contract.i64({ i64_: 1n })).result, 1n)
})

test("strukt_hel", async (t) => {
  let test = { a: 0, b: true, c: "world" }
  t.deepEqual((await contract.struktHel({ strukt: test })).result, ["Hello", "world"])
})

test("strukt", async (t) => {
  let test = { a: 0, b: true, c: "hello" }
  t.deepEqual((await contract.strukt({ strukt: test })).result, test)
})

test('simple first', async t => {
  const simple = { tag: 'First', values: undefined } as const
  t.deepEqual((await contract.simple({ simple })).result, simple)
})

test('simple second', async t => {
  const simple = { tag: 'Second', values: undefined } as const
  t.deepEqual((await contract.simple({ simple })).result, simple)
})

test('simple third', async t => {
  const simple = { tag: 'Third', values: undefined } as const
  t.deepEqual((await contract.simple({ simple })).result, simple)
})

test('complex with struct', async t => {
  const arg = { tag: 'Struct', values: [{ a: 0, b: true, c: 'hello' }] } as const
  const ret = { tag: 'Struct', values: [{ a: 0, b: true, c: 'hello' }] }
  t.deepEqual((await contract.complex({ complex: arg })).result, ret)
})

test('complex with tuple', async t => {
  const arg = { tag: 'Tuple', values: [[{ a: 0, b: true, c: 'hello' }, { tag: 'First', values: undefined }]] } as const
  const ret = { tag: 'Tuple', values: [[{ a: 0, b: true, c: 'hello' }, { tag: 'First', values: undefined }]] }
  t.deepEqual((await contract.complex({ complex: arg })).result, ret)
})

test('complex with enum', async t => {
  const arg = { tag: 'Enum', values: [{ tag: 'First', values: undefined }] } as const
  const ret = { tag: 'Enum', values: [{ tag: 'First', values: undefined }] }
  t.deepEqual((await contract.complex({ complex: arg })).result, ret)
})

test('complex with asset', async t => {
  const arg = { tag: 'Asset', values: [addr, 1n] } as const
  const ret = { tag: 'Asset', values: [addr, 1n] }
  t.deepEqual((await contract.complex({ complex: arg })).result, ret)
})

test('complex with void', async t => {
  const complex = { tag: 'Void', values: undefined } as const
  t.deepEqual((await contract.complex({ complex })).result, complex)
})

test('addresse', async t => {
  t.deepEqual((await contract.addresse({ addresse: addr })).result, addr)
})

test('bytes', async t => {
  const bytes = Buffer.from('hello')
  t.deepEqual((await contract.bytes({ bytes })).result, bytes)
})

test('bytes_n', async t => {
  const bytes_n = Buffer.from('123456789') // what's the correct way to construct bytes_n?
  t.deepEqual((await contract.bytesN({ bytes_n })).result, bytes_n)
})

test('card', async t => {
  const card = 11
  t.is((await contract.card({ card })).result, card)
})

test('boolean', async t => {
  t.is((await contract.boolean({ boolean: true })).result, true)
})

test('not', async t => {
  t.is((await contract.not({ boolean: true })).result, false)
})

test('i128', async t => {
  t.is((await contract.i128({ i128: -1n })).result, -1n)
})

test('u128', async t => {
  t.is((await contract.u128({ u128: 1n })).result, 1n)
})

test('multi_args', async t => {
  t.is((await contract.multiArgs({ a: 1, b: true })).result, 1)
  t.is((await contract.multiArgs({ a: 1, b: false })).result, 0)
})

test('map', async t => {
  const map = new Map()
  map.set(1, true)
  map.set(2, false)
  // map.set(3, 'hahaha') // should throw an error
  t.deepEqual((await contract.map({ map })).result, map)
})

test('vec', async t => {
  const vec = [1, 2, 3]
  t.deepEqual((await contract.vec({ vec })).result, vec)
})

test('tuple', async t => {
  const tuple = ['hello', 1] as const
  t.deepEqual((await contract.tuple({ tuple })).result, tuple)
})

test('option', async t => {
  // this makes sense
  t.deepEqual((await contract.option({ option: 1 })).result, 1)

  // this passes but shouldn't
  t.deepEqual((await contract.option({ option: undefined })).result, undefined)

  // this is the behavior we probably want, but fails
  // t.deepEqual(await contract.option(), undefined) // typing and implementation require the object
  // t.deepEqual((await contract.option({})).result, undefined) // typing requires argument; implementation would be fine with this
  // t.deepEqual((await contract.option({ option: undefined })).result, undefined)
})

test('u256', async t => {
  t.is((await contract.u256({ u256: 1n })).result, 1n)
})

test('i256', async t => {
  t.is((await contract.i256({ i256: -1n })).result, -1n)
})

test('string', async t => {
  t.is((await contract.string({ string: 'hello' })).result, 'hello')
})

test('tuple_strukt', async t => {
  const arg = [{ a: 0, b: true, c: 'hello' }, { tag: 'First', values: undefined }] as const
  const res = [{ a: 0, b: true, c: 'hello' }, { tag: 'First', values: undefined }]
  t.deepEqual((await contract.tupleStrukt({ tuple_strukt: arg })).result, res)
})