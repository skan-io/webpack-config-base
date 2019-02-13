import {getEntries} from '.';


jest.mock('react-entry-loader/entry', ()=> (
  jest.fn((obj)=> (path)=> ({obj, path}))
));

describe('Getting webpack entry points', ()=> {
  it('get appropriate entries', ()=> {
    expect(
      getEntries(['index.html.js'], 'test-url.com', 'version-test')
    ).toEqual({
      index: [
        '@babel/polyfill',
        {
          obj: {
            output: 'index.html',
            appUrl: 'test-url.com',
            version: 'version-test'
          },
          path: './src/index.html.js'
        }
      ]
    });
  });

  it('can handle empty array', ()=> {
    expect(
      getEntries([], 'test-url.com', 'version-test')
    ).toEqual({});
  });

  it('will throw if file type is not .html.js', ()=> {
    expect(
      ()=> getEntries(['index.html'], 'test-url.com', 'version-test')
    ).toThrow(new Error('Must be a .html.js file'));

    expect(
      ()=> getEntries(['index.bad.js'], 'test-url.com', 'version-test')
    ).toThrow(new Error('Must be a .html.js file'));
  });
});
