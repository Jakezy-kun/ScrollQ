import { loadPostVideo, resetPostVideos } from './postVideo';

const clip = {
  url: 'https://cdn.pixabay.com/v.mp4',
  poster: '',
  width: 360,
  height: 640,
  pageUrl: '',
  user: '',
};

function respond(status: number, body: unknown = {}) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => resetPostVideos());

describe('loadPostVideo', () => {
  it('asks the server once per search and returns the clip', async () => {
    const fetchSpy = respond(200, { video: clip });
    expect(await loadPostVideo('cat')).toEqual(clip);
    expect(await loadPostVideo('cat')).toEqual(clip);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('/api/videos?q=cat');
  });

  it('stops asking for the session once the server says videos are off', async () => {
    const fetchSpy = respond(503);
    expect(await loadPostVideo('cat')).toBeNull();
    expect(await loadPostVideo('dog')).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('never throws and skips the network when offline', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    expect(await loadPostVideo('cat')).toBeNull();

    resetPostVideos();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchSpy = respond(200, { video: clip });
    expect(await loadPostVideo('owl')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
