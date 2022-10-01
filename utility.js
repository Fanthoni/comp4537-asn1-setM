getThreeCharDigit = function (digit) {
    if (digit.length === 3) {
        return digit
    } else if (digit.length === 2) {
        return `0${digit}`
    } else {
        return `00${digit}`
    }
}

module.exports = getThreeCharDigit;