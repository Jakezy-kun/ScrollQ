/**
 * Search words a post may use for its background clip (posts.json `videoQuery`).
 * Short and plain on purpose: the video server only accepts words that match this.
 */
export const VIDEO_QUERY_PATTERN = /^[a-z][a-z ]{1,39}$/;
