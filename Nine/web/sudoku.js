// JavaScript port of Nine/sudoku.py: bitmask candidates + "fewest candidates first" backtracking.
// The board is a flat array of 81 numbers (0 = empty).
const Sudoku = (function(){
    const ALL = 0x1FF;
    const bit = function(v){ return 1 << (v - 1); };
    const boxOf = function(r, c){ return Math.floor(r / 3) * 3 + Math.floor(c / 3); };
    function popcount(x){ let n = 0; while(x){ x &= x - 1; n++; } return n; }
    function digitsIn(mask){ const out = []; for(let d = 1; d <= 9; d++) if(mask & bit(d)) out.push(d); return out; }
    function shuffle(a){ for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

    function Masks(board){
        this.rows = new Array(9).fill(0);
        this.cols = new Array(9).fill(0);
        this.boxes = new Array(9).fill(0);
        this.valid = true;
        for(let i = 0; i < 81; i++){
            const v = board[i];
            if(!v) continue;
            const r = Math.floor(i / 9), c = i % 9, b = bit(v);
            if(this.rows[r] & b || this.cols[c] & b || this.boxes[boxOf(r, c)] & b) this.valid = false;
            this.place(r, c, v);
        }
    }
    Masks.prototype.candidates = function(r, c){ return ALL & ~(this.rows[r] | this.cols[c] | this.boxes[boxOf(r, c)]); };
    Masks.prototype.place = function(r, c, v){ const b = bit(v); this.rows[r] |= b; this.cols[c] |= b; this.boxes[boxOf(r, c)] |= b; };
    Masks.prototype.remove = function(r, c, v){ const b = ~bit(v); this.rows[r] &= b; this.cols[c] &= b; this.boxes[boxOf(r, c)] &= b; };

    function conflicts(board){
        const bad = new Set();
        const groups = [];
        for(let k = 0; k < 9; k++){
            const row = [], col = [], box = [];
            const br = Math.floor(k / 3) * 3, bc = (k % 3) * 3;
            for(let j = 0; j < 9; j++){
                row.push(k * 9 + j);
                col.push(j * 9 + k);
                box.push((br + Math.floor(j / 3)) * 9 + bc + j % 3);
            }
            groups.push(row, col, box);
        }
        groups.forEach(function(g){
            const seen = {};
            g.forEach(function(i){ const v = board[i]; if(v) (seen[v] = seen[v] || []).push(i); });
            Object.keys(seen).forEach(function(v){ if(seen[v].length > 1) seen[v].forEach(function(i){ bad.add(i); }); });
        });
        return bad;
    }

    function bestCell(board, masks){
        let best = -1, bestMask = 0, bestCount = 10;
        for(let i = 0; i < 81; i++){
            if(board[i]) continue;
            const m = masks.candidates(Math.floor(i / 9), i % 9);
            const n = popcount(m);
            if(n < bestCount){ best = i; bestMask = m; bestCount = n; if(n <= 1) break; }
        }
        return [best, bestMask];
    }

    function solve(input, randomize){
        const board = input.slice();
        const masks = new Masks(board);
        if(!masks.valid) return null;
        function backtrack(){
            const found = bestCell(board, masks), i = found[0];
            if(i === -1) return true;
            const r = Math.floor(i / 9), c = i % 9;
            const options = digitsIn(found[1]);
            if(randomize) shuffle(options);
            for(const v of options){
                board[i] = v; masks.place(r, c, v);
                if(backtrack()) return true;
                masks.remove(r, c, v); board[i] = 0;
            }
            return false;
        }
        return backtrack() ? board : null;
    }

    function countSolutions(input, limit){
        limit = limit || 2;
        const board = input.slice();
        const masks = new Masks(board);
        if(!masks.valid) return 0;
        let found = 0;
        (function backtrack(){
            const f = bestCell(board, masks), i = f[0];
            if(i === -1){ found++; return found >= limit; }
            const r = Math.floor(i / 9), c = i % 9;
            for(const v of digitsIn(f[1])){
                board[i] = v; masks.place(r, c, v);
                if(backtrack()) return true;
                masks.remove(r, c, v); board[i] = 0;
            }
            return false;
        })();
        return found;
    }

    // Step-by-step solver for the animation: yields ['place', i, v], ['remove', i, 0], then ['done', board] or ['fail']
    function* solveSteps(input){
        const board = input.slice();
        const masks = new Masks(board);
        if(!masks.valid){ yield ['fail']; return; }
        let f = bestCell(board, masks);
        if(f[0] === -1){ yield ['done', board]; return; }
        const stack = [[f[0], digitsIn(f[1])]];
        while(stack.length){
            const top = stack[stack.length - 1], i = top[0], options = top[1];
            const r = Math.floor(i / 9), c = i % 9;
            if(board[i]){ masks.remove(r, c, board[i]); board[i] = 0; yield ['remove', i, 0]; }
            if(!options.length){ stack.pop(); continue; }
            const v = options.shift();
            board[i] = v; masks.place(r, c, v);
            yield ['place', i, v];
            f = bestCell(board, masks);
            if(f[0] === -1){ yield ['done', board]; return; }
            stack.push([f[0], digitsIn(f[1])]);
        }
        yield ['fail'];
    }

    const CLUES = { easy: 40, medium: 32, hard: 26 };

    function carve(difficulty){
        const solution = solve(new Array(81).fill(0), true);
        const puzzle = solution.slice();
        const cells = shuffle(Array.from({ length: 41 }, function(_, i){ return i; }));
        let clues = 81;
        for(const i of cells){
            if(clues <= CLUES[difficulty]) break;
            const pair = i === 40 ? [40] : [i, 80 - i];
            const saved = pair.map(function(k){ return puzzle[k]; });
            pair.forEach(function(k){ puzzle[k] = 0; });
            if(countSolutions(puzzle) === 1) clues -= pair.length;
            else pair.forEach(function(k, n){ puzzle[k] = saved[n]; });
        }
        return [puzzle, solution];
    }

    // A few attempts, keeping the one with the fewest clues
    function generate(difficulty, attempts){
        attempts = attempts || 12;
        let best = null;
        for(let a = 0; a < attempts; a++){
            const res = carve(difficulty);
            const clues = res[0].filter(Boolean).length;
            if(!best || clues < best[0].filter(Boolean).length) best = res;
            if(clues <= CLUES[difficulty]) break;
        }
        return best;
    }

    return { solve: solve, countSolutions: countSolutions, solveSteps: solveSteps, conflicts: conflicts, generate: generate, boxOf: boxOf };
})();
