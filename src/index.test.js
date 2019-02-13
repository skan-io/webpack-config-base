import webpackConfigurator from '.';
import {getEntries} from '.';


jest.mock('react-entry-loader/entry', ()=> (
  jest.fn((obj)=> (path)=> ({obj, path}))
));

test('webpack-config regression', ()=> {
  expect(webpackConfigurator(
    ['index.html.js'], 'build/pkg', 8080, 'favicon.png'
  )('production', 'test-url.com', 'path', 'version-test')
  ).toMatchSnapshot();
});

test('webpack-config regression', ()=> {
  expect(webpackConfigurator(
    ['index.html.js'], 'build/pkg', 8080, 'favicon.png', true
  )('webpack-dev', 'test-url.com', 'path', 'version-test')
  ).toMatchSnapshot();
});

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
