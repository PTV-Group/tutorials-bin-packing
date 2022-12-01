/**
 * This file contains general helper functions, for a convenient way
 * of manipulating DOM elements and value formatting.
 */

const getElement = (id) => document.getElementById(id);

const showElement = (id, displayMode) => getElement(id).style.display = !displayMode ? "block" : displayMode;

const hideElement = (id) => getElement(id).style.display = "none";

const enableElement = (IDs) => IDs.forEach(id => getElement(id).disabled = false);

const disableElement = (IDs) => IDs.forEach(id => getElement(id).disabled = true);

const removeAllChildNodes = (parent) => {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
};
