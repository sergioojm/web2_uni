const HOOKS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'countDocuments',
  'count',
  'distinct'
];

const excludeDeleted = function (next) {
  const filter = this.getFilter();
  const opts = this.getOptions();
  if (filter.deleted === undefined && !opts.withDeleted) {
    this.where({ deleted: false });
  }
  next();
};

export const applySoftDeletePlugin = (schema) => {
  HOOKS.forEach((hook) => schema.pre(hook, excludeDeleted));
};
