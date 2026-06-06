function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(4)}`;
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
}

module.exports = { formatCurrency, formatDuration };
