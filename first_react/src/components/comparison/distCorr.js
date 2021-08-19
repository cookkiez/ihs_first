function getDists(data, key) {
    var d = []
    data.map(el1 => {
        d.push(data.map(el2 => {
            return Math.abs(el1[key] - el2[key])
        }))
        return el1
    })

    var A = Array.from({
        length: d.length
    }, () => new Array(d[0].length).fill(0))

    var col_row_sum = 0

    d.map((row) => {
        return row.map(col => {
            col_row_sum += col
            return col
        })
    })

    var col_row_mean = col_row_sum / (d.length * d.length) // a_dot_dot, mean

    d.map((row, row_index) => {
        var row_sum = 0
        row.reduce((a, v) => {
            row_sum += v
            return v
        })
        var row_mean = row_sum / row.length // a_i_dot, mean
        row.map((col, col_index) => {
            var col_sum = 0
            d.map(r => {
                col_sum += r[col_index]
                return r
            })
            var col_mean = col_sum / d.length // a_dot_j, mean
            A[row_index][col_index] = col - col_mean - row_mean + col_row_mean
            return 0
        })
        return 0
    })

    return A
}

function getDVar(dists) {
    var dVar = 0
    dists.map(row => {
        return row.map(col => {
            dVar += (col * col)
            return dVar
        })
    })
    dVar /= (dists.length * dists.length)
    return dVar
    //return Math.sqrt(dVar)
}

var getDistCorr = (data, keys) => {
    var distsFirst = getDists(data, keys[0])
    var distsSecond = getDists(data, keys[1])

    var dCov = 0
    distsFirst.map((rowFirst, row_index) => {
        return rowFirst.map((colFirst, col_index) => {
            dCov += (colFirst * distsSecond[row_index][col_index])
            return dCov
        })
    })
    dCov /= (distsFirst.length * distsFirst.length)
    var dVarFirst = getDVar(distsFirst)
    var dVarSecond = getDVar(distsSecond)
    var distCorr = dCov / (Math.sqrt((dVarFirst * dVarSecond)))
    return distCorr
}

onmessage = (e) => {
    console.log("Starting distance correlation calculation")
    const { data, keys } = e.data
    var distCorr = getDistCorr(data, keys)
    console.log("Distance correlation calculation finished")
    postMessage({
        distCorr
    })
}
