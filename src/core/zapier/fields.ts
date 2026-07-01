type FieldWithKey = {
  key?: string;
};

const priorityByFieldKey: Record<string, number> = {
  projectId: 0,
  customerPoolId: 1,
};

export const sortPriorityFieldsFirst = <Field>(
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
    const leftPriority =
      leftKey === undefined ? undefined : priorityByFieldKey[leftKey];
    const rightPriority =
      rightKey === undefined ? undefined : priorityByFieldKey[rightKey];

    if (leftPriority !== undefined && rightPriority !== undefined) {
      return leftPriority - rightPriority;
    }

    if (leftPriority !== undefined) {
      return -1;
    }

    if (rightPriority !== undefined) {
      return 1;
    }

    return 0;
  });
