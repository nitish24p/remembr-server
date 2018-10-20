const createNewBoard = (level) => {
  const rows = 2 * level;
  const columns = 2 * level;
  const multiplier = Math.pow(level, 2);
  const indexingLimit = 2 * multiplier;
  let multiplierArr = new Array(indexingLimit).fill(0);
  multiplierArr = multiplierArr.map((v, i) => i + 1);
  multiplierArr = [...multiplierArr, ...multiplierArr].sort(() => Math.random() - Math.random());
  let result = [];
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    result.push(new Array(columns).fill(0));
  }

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      const elementToInsert = multiplierArr.pop();
      const cell = {
        value: elementToInsert,
        isOpen: false,
        isMatched: false,
        rowIndex,
        columnIndex
      };
      result[rowIndex][columnIndex] = cell;
    }
  }

  return result;
}

module.exports = {
  createNewBoard
}