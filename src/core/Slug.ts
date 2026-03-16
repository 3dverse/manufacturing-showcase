import slugify from "slugify";

//------------------------------------------------------------------------------
const SPECIAL_CHARACTERS_REGEX = /[^A-Za-z0-9_-]+/;

//------------------------------------------------------------------------------
const slugifyLowerAndTrim = (string: string) => {
    return slugify(string, { lower: true, trim: true, remove: /'+/g });
};

//------------------------------------------------------------------------------
const removeSpecialCharacters = (value: string) => {
    return value.replace(new RegExp(SPECIAL_CHARACTERS_REGEX.source, SPECIAL_CHARACTERS_REGEX.flags + "g"), "-");
};

//------------------------------------------------------------------------------
export const formatSlug = (slug: string) => {
    const slugWithoutSpecialChar = removeSpecialCharacters(slug);
    return slugifyLowerAndTrim(slugWithoutSpecialChar);
};
