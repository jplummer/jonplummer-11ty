module.exports = {
  permalink: function(data) {
    const date = new Date(data.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const slug = data.page.fileSlug;
    return `/${year}/${month}/${day}/${slug}/`;
  }
};
