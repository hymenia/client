import adapter from '@sveltejs/adapter-static';

let cfg = {
  kit: {
    adapter: adapter({
      fallback: 'index.html'
    })
  }
};

export default cfg;
