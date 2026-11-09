const { loadPortfolios, portfolioPages, mainList } = require('../../eleventy/utils/portfolios');

/**
 * Global `portfolioLists` from portfolios.yaml:
 *   main  – the /portfolio/ list, rendered by src/portfolio.njk
 *   lists – every other list that builds this run, paginated by src/portfolio-list.njk
 *           (drafts build only under `pnpm run dev`)
 * The raw file is also global data as `portfolios` (all lists, any status).
 */
module.exports = () => {
  const lists = loadPortfolios();
  return { main: mainList(lists), lists: portfolioPages(lists) };
};
