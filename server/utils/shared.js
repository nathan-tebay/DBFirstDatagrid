/**
 * Convert camel case field names into capitalized and spaced labels.
 * @param  {String} string
 */
export const camelCaseToLabel = (string) => {
  if (string === "") return string;

  string = string.replace(/(.*)([A-Z])(.*)/g, "$1 $2$3");
  string = string[0].toUpperCase() + string.slice(1);

  if (string[string.length - 1] === "s") {
    string = string.replace(/ies$/, "y").replace(/s$/, "");
  }
  return string;
};
