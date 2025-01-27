const mockHtml = `
<div class="thing link">
  <a class="title" href="https://reddit.com/test1">Test Post 1</a>
  <img src="https://example.com/image1.jpg" />
  <div class="usertext-body">Test content 1</div>
</div>
<div class="thing link">
  <a class="title" href="https://reddit.com/test2">Test Post 2</a>
  <div class="usertext-body">Test content 2</div>
</div>`;

const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(mockHtml),
  }),
);

global.fetch = mockFetch;
module.exports = mockFetch;
