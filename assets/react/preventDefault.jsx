export const preventDefault = fn => (e => {
    e.preventDefault();
    fn(e)
});