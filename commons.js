module.exports = {
    // Number of modules to be used for each test case
    defaultNumberOfModules: 4,

    // Set of alphabets to be used for module prefix
    alphabets: 'abcdefghijklmnopqrstuvwxyz'.split(''),

    // List of module grades
    grades: Array(9).fill('').map((_, index) => index * 0.5),

    // Has implemented Bulk Retrieve
    isBulkRetrieve: false
};