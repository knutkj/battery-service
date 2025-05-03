/**
 * Flattens a parsed KSY object according to the flattener spec in
 * docs/specs/ksy/flattening.md. Throws on unsupported features. Returns a new
 * flattened KSY object.
 *
 * @param {object} ksyObj - The parsed KSY object to flatten.
 * @returns {object} The flattened KSY object.
 * @throws {Error} If unsupported features are encountered.
 */
export default function flattenKsyObject(ksyObj) {
  if (!ksyObj || typeof ksyObj !== "object")
    throw new Error("Input must be a parsed KSY object");

  const usedTypes = new Set();
  const topId = ksyObj.meta && ksyObj.meta.id ? ksyObj.meta.id : "spec";
  const enumsOut = {};
  const enumsPrefix = enumsPrefixFactory(topId);
  const types = ksyObj.types || {};
  let flatSeq = [];
  if (ksyObj.seq) {
    for (const field of ksyObj.seq) {
      checkUnsupported(field, `seq.${field.id}`);
      if (field.type && types[field.type]) {
        flatSeq = flatSeq.concat(
          inlineType(
            field.type,
            field.id + "_",
            types,
            `seq.${field.id}`,
            usedTypes,
            enumsOut,
            enumsPrefix,
          ),
        );
      } else {
        const f = { ...field };
        if (f.enum) f.enum = enumsPrefix(f.enum);
        flatSeq.push(f);
      }
    }
  }
  if (ksyObj.instances) {
    for (const [instName, inst] of Object.entries(ksyObj.instances)) {
      checkUnsupported(inst, `instances.${instName}`);
      if (typeof inst.pos === "string" || typeof inst.size === "string")
        throw new Error(
          `expressions in size/pos not supported (instances.${instName})`,
        );
      const f = { ...inst, id: instName };
      if (f.enum) f.enum = enumsPrefix(f.enum);
      flatSeq.push(f);
    }
  }
  if (ksyObj.enums) {
    for (const [enumName, enumDef] of Object.entries(ksyObj.enums)) {
      enumsOut[enumsPrefix(enumName)] = enumDef;
    }
  }
  const out = {
    ...ksyObj,
    meta: { ...ksyObj.meta, id: topId + "_flat" },
    seq: flatSeq,
    enums: Object.keys(enumsOut).length ? enumsOut : undefined,
  };
  delete out.types;
  delete out.instances;
  delete out.imports;
  return out;
}

/**
 * Returns a function that prefixes enum names with the given top-level id.
 *
 * @param {string} topId - The top-level meta.id of the KSY spec.
 * @returns {(id: string) => string} Function to prefix enum names.
 */
function enumsPrefixFactory(topId) {
  return (id) => `${topId}_${id}`;
}

/**
 * Throws if the given attribute uses any unsupported feature for flattening.
 *
 * @param {object} attr - The attribute object to check.
 * @param {string} path - The path to the attribute (for error messages).
 * @throws {Error} If an unsupported feature is found.
 */
function checkUnsupported(attr, path) {
  if ("switch-on" in attr || (attr.type && attr.type.switch_on))
    throw new Error(`switch-on is not supported in flattened format (${path})`);
  if ("if" in attr)
    throw new Error(`conditional fields are not supported (${path})`);
  if ("repeat" in attr)
    throw new Error(`repeated fields are not supported (${path})`);
  if (typeof attr.size === "string" || typeof attr.pos === "string")
    throw new Error(`expressions in size/pos not supported (${path})`);
  if ("value" in attr)
    throw new Error(`computed instances are not supported (${path})`);
}

/**
 * Recursively inlines a user-defined type into fields, prefixing field names
 * and hoisting enums.
 *
 * @param {string} typeName - The name of the type to inline.
 * @param {string} prefix - The prefix to apply to all inlined field ids.
 * @param {object} types - The map of all user-defined types.
 * @param {string} path - The path to the current type (for error messages).
 * @param {Set<string>} usedTypes - Set of already inlined types (for reuse
 *   detection).
 * @param {object} enumsOut - Object to collect hoisted enums.
 * @param {(id: string) => string} enumsPrefix - Function to prefix enum names.
 * @returns {object[]} The flattened fields for this type.
 * @throws {Error} If type reuse or unsupported features are found.
 */
export function inlineType(
  typeName,
  prefix,
  types,
  path,
  usedTypes,
  enumsOut,
  enumsPrefix,
) {
  if (usedTypes.has(typeName))
    throw new Error(
      `type ${typeName} is referenced multiple times, reuse is not supported (${path})`,
    );
  usedTypes.add(typeName);
  const typeDef = types[typeName];
  if (!typeDef) throw new Error(`Type ${typeName} not found (${path})`);
  let fields = [];
  if (typeDef.seq) {
    for (const field of typeDef.seq) {
      checkUnsupported(field, `${path}.${field.id}`);
      if (field.type && types[field.type]) {
        fields = fields.concat(
          inlineType(
            field.type,
            prefix + field.id + "_",
            types,
            `${path}.${field.id}`,
            usedTypes,
            enumsOut,
            enumsPrefix,
          ),
        );
      } else {
        const f = { ...field, id: prefix + field.id };
        if (f.enum) f.enum = enumsPrefix(f.enum);
        fields.push(f);
      }
    }
  }
  if (typeDef.instances) {
    for (const [instName, inst] of Object.entries(typeDef.instances)) {
      checkUnsupported(inst, `${path}.${instName}`);
      if (typeof inst.pos === "string" || typeof inst.size === "string")
        throw new Error(
          `expressions in size/pos not supported (${path}.${instName})`,
        );
      const f = { ...inst, id: prefix + instName };
      if (f.enum) f.enum = enumsPrefix(f.enum);
      fields.push(f);
    }
  }
  if (typeDef.enums) {
    for (const [enumName, enumDef] of Object.entries(typeDef.enums)) {
      enumsOut[enumsPrefix(enumName)] = enumDef;
    }
  }
  return fields;
}
