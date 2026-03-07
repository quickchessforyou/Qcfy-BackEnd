export const validatePuzzleSolution = (puzzle, solution) => {
    try {
        // Normalize user solution
        let userMoves = solution;
        if (typeof userMoves === 'string') {
            try {
                userMoves = JSON.parse(userMoves);
            } catch (e) {
                userMoves = [userMoves];
            }
        }
        if (!Array.isArray(userMoves)) userMoves = [userMoves];

        // Check primary solution
        let mainMoves = puzzle.solutionMoves;
        if (typeof mainMoves === 'string') {
            try {
                mainMoves = JSON.parse(mainMoves);
            } catch (e) {
                mainMoves = [mainMoves];
            }
        }
        if (!Array.isArray(mainMoves)) mainMoves = [mainMoves];

        if (JSON.stringify(mainMoves) === JSON.stringify(userMoves)) {
            return true;
        }

        // Check alternative solutions
        if (Array.isArray(puzzle.alternativeSolutions)) {
            for (const alt of puzzle.alternativeSolutions) {
                let altMoves = alt;
                if (typeof altMoves === 'string') {
                    try {
                        altMoves = JSON.parse(altMoves);
                    } catch (e) {
                        altMoves = [altMoves];
                    }
                }
                if (!Array.isArray(altMoves)) altMoves = [altMoves];

                if (JSON.stringify(altMoves) === JSON.stringify(userMoves)) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Solution validation error:', error);
        return false;
    }
};
