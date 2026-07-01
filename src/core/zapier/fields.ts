type FieldWithKey = {
  key?: string;
};

export const sortProjectIdFirst = <Field>(
  fields: readonly Field[],
): Field[] =>
  [...fields].sort((left, right) => {
    const leftKey =
      typeof left === 'object' && left !== null
        ? (left as FieldWithKey).key
        : undefined;
    const rightKey =
      typeof right === 'object' && right !== null
        ? (right as FieldWithKey).key
        : undefined;

    if (leftKey === 'projectId') {
      return rightKey === 'projectId' ? 0 : -1;
    }

    if (rightKey === 'projectId') {
      return 1;
    }

    return 0;
  });
