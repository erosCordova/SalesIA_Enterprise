import math

import pytest
from pydantic import ValidationError

from app.schemas.statistics import (
    BayesRequest,
    NumericValuesRequest,
    RandomVariableRequest,
)
from app.services.statistics import (
    analyze_random_variable,
    calculate_bayes,
    calculate_mean,
    calculate_median,
    compare_statistics,
)


@pytest.mark.parametrize(
    ("values", "expected"),
    [
        ([0], 0),
        ([-5, -1, -3], -3),
        ([7, 7, 7, 7], 7),
        ([1.25, 2.75], 2),
    ],
)
def test_mean_handles_zero_negative_duplicate_and_decimal_values(values, expected):
    result = calculate_mean(NumericValuesRequest(values=values))

    assert result.mean == pytest.approx(expected)
    assert result.count == len(values)


@pytest.mark.parametrize(
    ("values", "expected"),
    [
        ([0], 0),
        ([-5, -1, -3], -3),
        ([2, 2, 2, 8], 2),
        ([1.25, 2.75], 2),
    ],
)
def test_median_handles_small_negative_duplicate_and_decimal_values(values, expected):
    result = calculate_median(NumericValuesRequest(values=values))

    assert result.median == pytest.approx(expected)
    assert result.count == len(values)


def test_compare_statistics_handles_repeated_values_with_no_difference():
    result = compare_statistics(NumericValuesRequest(values=[-2, -2, -2, -2]))

    assert result.mean == pytest.approx(-2)
    assert result.median == pytest.approx(-2)
    assert result.difference == pytest.approx(0)
    assert result.interpretation == "La media y la mediana coinciden."


@pytest.mark.parametrize(
    ("probability_a", "probability_b_given_a", "probability_b", "expected"),
    [
        (0, 0, 1, 0),
        (1, 1, 1, 1),
        (0.2, 0, 0.3, 0),
        (0.5, 0.5, 0.25, 1),
    ],
)
def test_bayes_handles_probability_boundaries(
    probability_a,
    probability_b_given_a,
    probability_b,
    expected,
):
    request = BayesRequest(
        event_a="A",
        event_b="B",
        probability_a=probability_a,
        probability_b_given_a=probability_b_given_a,
        probability_b=probability_b,
    )

    assert calculate_bayes(request).posterior_probability == pytest.approx(expected)


def test_random_variable_handles_negative_values_and_zero_probability_outcome():
    request = RandomVariableRequest(
        name="resultado neto",
        values=[-10, 0, 10],
        probabilities=[0.5, 0, 0.5],
    )

    result = analyze_random_variable(request)

    assert result.expected_value == pytest.approx(0)
    assert result.variance == pytest.approx(100)
    assert result.standard_deviation == pytest.approx(10)


def test_random_variable_single_outcome_has_no_uncertainty():
    request = RandomVariableRequest(
        name="resultado",
        values=[-4],
        probabilities=[1],
    )

    result = analyze_random_variable(request)

    assert result.expected_value == pytest.approx(-4)
    assert result.variance == pytest.approx(0)
    assert result.standard_deviation == pytest.approx(0)


def test_numeric_request_accepts_minimum_and_maximum_supported_lengths():
    assert NumericValuesRequest(values=[0]).values == [0]

    maximum_size = NumericValuesRequest(values=[1] * 1000)
    result = calculate_mean(maximum_size)

    assert result.count == 1000
    assert result.mean == pytest.approx(1)


@pytest.mark.parametrize("values", [[], [1] * 1001, [float("nan")], [float("inf")], [-float("inf")]])
def test_numeric_request_rejects_out_of_range_lengths_and_non_finite_values(values):
    with pytest.raises(ValidationError):
        NumericValuesRequest(values=values)


def test_random_variable_accepts_probability_sum_at_tolerance_boundary():
    request = RandomVariableRequest(
        name="distribución",
        values=[0, 1],
        probabilities=[0.5, 0.5000009],
    )

    assert sum(request.probabilities) == pytest.approx(1.0000009)


@pytest.mark.parametrize(
    "probabilities",
    [
        [],
        [0.4, 0.4],
        [-0.1, 1.1],
        [0.5, 0.500002],
        [float("nan"), float("nan")],
    ],
)
def test_random_variable_rejects_invalid_distributions(probabilities):
    with pytest.raises(ValidationError):
        RandomVariableRequest(
            name="distribución",
            values=[0, 1],
            probabilities=probabilities,
        )


@pytest.mark.parametrize(
    "probability_b",
    [0, -0.1, 1.1, float("nan"), float("inf")],
)
def test_bayes_rejects_invalid_evidence_probability(probability_b):
    with pytest.raises(ValidationError):
        BayesRequest(
            event_a="A",
            event_b="B",
            probability_a=0.2,
            probability_b_given_a=0.5,
            probability_b=probability_b,
        )


@pytest.mark.parametrize(
    ("model", "values"),
    [
        (NumericValuesRequest, [1e308, 1e308]),
    ],
)
def test_large_finite_values_are_preserved(model, values):
    request = model(values=values)
    mean = calculate_mean(request)
    median = calculate_median(request)

    assert math.isfinite(mean.mean)
    assert math.isfinite(median.median)
    assert mean.mean == pytest.approx(1e308)
    assert median.median == pytest.approx(1e308)
