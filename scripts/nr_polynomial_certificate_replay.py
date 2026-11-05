"""Independent stdlib replay of complete QQ[x,y,z] matrix certificates.

No SymPy, sampled direction, tolerance, floating point, or solver import.
Each matrix cell is explicitly registered, including every zero polynomial.
"""

from fractions import Fraction


SCHEMA = "nr-case12-polynomial-matrix-v1"
VARIABLES = ["x", "y", "z"]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def decode_polynomial(terms, *, max_degree):
    require(type(max_degree) is int and max_degree >= 0, "nonnegative degree bound")
    require(type(terms) is list, "polynomial term list required")
    result, previous = {}, None
    for term in terms:
        require(type(term) is list and len(term) == 5, "five-field polynomial term")
        exponent = tuple(term[:3])
        require(
            all(type(x) is int and x >= 0 for x in exponent),
            "exact nonnegative exponents",
        )
        require(
            sum(exponent) <= max_degree, "polynomial degree exceeds registered bound"
        )
        require(
            previous is None or previous < exponent,
            "unique sorted polynomial exponents",
        )
        numerator, denominator = term[3:]
        require(
            type(numerator) is str and type(denominator) is str,
            "integer coefficient strings required",
        )
        try:
            n, d = int(numerator), int(denominator)
        except ValueError:
            raise ValueError("integer coefficient strings required") from None
        require(
            n != 0 and d > 0 and str(n) == numerator and str(d) == denominator,
            "canonical nonzero coefficient with positive denominator",
        )
        coefficient = Fraction(n, d)
        require(
            str(coefficient.numerator) == numerator
            and str(coefficient.denominator) == denominator,
            "reduced rational coefficient required",
        )
        result[exponent] = coefficient
        previous = exponent
    return result


def encode_polynomial(poly):
    require(type(poly) is dict, "sparse polynomial dictionary required")
    result = []
    for exponent, coefficient in sorted(poly.items()):
        require(
            type(exponent) is tuple
            and len(exponent) == 3
            and all(type(x) is int and x >= 0 for x in exponent),
            "three exact exponents",
        )
        require(
            type(coefficient) is Fraction and coefficient != 0,
            "nonzero Fraction coefficients",
        )
        result.append(
            [*exponent, str(coefficient.numerator), str(coefficient.denominator)]
        )
    return result


def matrix_shape(matrix):
    require(
        type(matrix) is list
        and bool(matrix)
        and type(matrix[0]) is list
        and bool(matrix[0]),
        "nonempty matrix list required",
    )
    columns = len(matrix[0])
    require(
        all(type(row) is list and len(row) == columns for row in matrix),
        "rectangular matrix required",
    )
    require(
        all(type(poly) is dict for row in matrix for poly in row),
        "polynomial cells required",
    )
    return len(matrix), columns


def decode_matrix(record, *, shape, max_degree):
    require(
        type(shape) in (tuple, list)
        and len(shape) == 2
        and all(type(x) is int and x > 0 for x in shape),
        "explicit positive matrix dimensions",
    )
    require(
        type(record) is dict
        and set(record) == {"schema", "variables", "shape", "entries"},
        "exact polynomial matrix schema",
    )
    require(
        record["schema"] == SCHEMA and record["variables"] == VARIABLES,
        "fixed QQ[x,y,z] matrix representation",
    )
    require(
        type(record["shape"]) is list
        and all(type(x) is int for x in record["shape"])
        and record["shape"] == list(shape),
        "matrix shape mismatch",
    )
    rows, columns = shape
    require(
        type(record["entries"]) is list and len(record["entries"]) == rows * columns,
        "all matrix cells required, including zeros",
    )
    result = [[None for _ in range(columns)] for _ in range(rows)]
    for position, entry in enumerate(record["entries"]):
        i, j = divmod(position, columns)
        require(
            type(entry) is list
            and len(entry) == 3
            and type(entry[0]) is type(entry[1]) is int
            and entry[:2] == [i, j],
            "complete unique row-major matrix coordinates",
        )
        result[i][j] = decode_polynomial(entry[2], max_degree=max_degree)
    return result


def encode_matrix(matrix):
    rows, columns = matrix_shape(matrix)
    return dict(
        schema=SCHEMA,
        variables=VARIABLES.copy(),
        shape=[rows, columns],
        entries=[
            [i, j, encode_polynomial(matrix[i][j])]
            for i in range(rows)
            for j in range(columns)
        ],
    )


def add_product(target, left, right, *, factor=Fraction(1)):
    """Exact sparse convolution, cancelling only exact zero coefficients."""
    for a, x in left.items():
        for b, y in right.items():
            exponent = tuple(a[k] + b[k] for k in range(3))
            value = target.get(exponent, Fraction(0)) + factor * x * y
            if value:
                target[exponent] = value
            else:
                target.pop(exponent, None)


def multiply(left, right, *, guard=lambda: None):
    rows, inner = matrix_shape(left)
    other_inner, columns = matrix_shape(right)
    require(inner == other_inner, "matching polynomial matrix dimensions")
    result = [[{} for _ in range(columns)] for _ in range(rows)]
    right_rows = [[(j, poly) for j, poly in enumerate(row) if poly] for row in right]
    products = 0
    for i, row in enumerate(left):
        guard()
        for k, poly in enumerate(row):
            if not poly:
                continue
            for j, other in right_rows[k]:
                if products % 128 == 0:
                    guard()
                add_product(result[i][j], poly, other)
                products += 1
    guard()
    return result


def residual(dtilde, stilde, delta, *, guard=lambda: None):
    product = multiply(dtilde, stilde, guard=guard)
    rows, columns = matrix_shape(product)
    require(rows == columns, "square right-section identity required")
    one = {(0, 0, 0): Fraction(1)}
    for index in range(rows):
        add_product(product[index][index], delta, one, factor=Fraction(-1))
    return product


def zero_check(matrix, shape):
    require(matrix_shape(matrix) == tuple(shape), "registered residual shape required")
    for i, row in enumerate(matrix):
        for j, poly in enumerate(row):
            if poly:
                raise ValueError(f"nonzero polynomial residual at ({i},{j})")
    return shape[0] * shape[1]


def coefficient_count(matrix):
    matrix_shape(matrix)
    return sum(len(poly) for row in matrix for poly in row)
