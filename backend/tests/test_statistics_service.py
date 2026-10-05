import math

import pytest

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


def test_calculate_mean_for_multiple_values():
    result = calculate_mean(NumericValuesRequest(values=[2, 4, 9]))

    assert result.count == 3
    assert result.mean == pytest.approx(5)


def test_calculate_mean_for_single_value():
    result = calculate_mean(NumericValuesRequest(values=[-7.5]))

    assert result.count == 1
    assert result.mean == pytest.approx(-7.5)


def test_calculate_median_sorts_odd_sized_input():
    result = calculate_median(NumericValuesRequest(values=[9, 1, 4]))

    assert result.count == 3
    assert result.median == pytest.approx(4)


def test_calculate_median_averages_middle_even_sized_values():
    result = calculate_median(NumericValuesRequest(values=[9, -3, 7, 1]))

    assert result.count == 4
    assert result.median == pytest.approx(4)


def test_compare_statistics_when_mean_and_median_match():
    result = compare_statistics(NumericValuesRequest(values=[1, 2, 3]))

    assert result.count == 3
    assert result.mean == pytest.approx(2)
    assert result.median == pytest.approx(2)
    assert result.difference == pytest.approx(0)
    assert result.interpretation == "La media y la mediana coinciden."


def test_compare_statistics_when_high_value_raises_mean():
    result = compare_statistics(NumericValuesRequest(values=[1, 2, 100]))

    assert result.mean > result.median
    assert result.difference == pytest.approx(97 / 3)
    assert "valores altos" in result.interpretation


def test_compare_statistics_when_low_value_lowers_mean():
    result = compare_statistics(NumericValuesRequest(values=[-100, 2, 3]))

    assert result.median > result.mean
    assert result.difference == pytest.approx(101 / 3)
    assert "valores bajos" in result.interpretation


def test_calculate_bayes_returns_posterior_and_user_facing_explanation():
    request = BayesRequest(
        event_a="compra",
        event_b="promoción",
        probability_a=0.01,
        probability_b_given_a=0.9,
        probability_b=0.05,
    )

    result = calculate_bayes(request)

    assert result.posterior_probability == pytest.approx(0.18)
    assert result.formula == "P(A|B) = P(B|A) × P(A) / P(B)"
    assert result.interpretation == (
        "La probabilidad de compra dado promoción es 0.1800."
    )


def test_analyze_random_variable_calculates_weighted_statistics():
    request = RandomVariableRequest(
        name="ventas",
        values=[0, 1, 2],
        probabilities=[0.25, 0.5, 0.25],
    )

    result = analyze_random_variable(request)

    assert result.name == "ventas"
    assert result.observations == 3
    assert result.expected_value == pytest.approx(1)
    assert result.variance == pytest.approx(0.5)
    assert result.standard_deviation == pytest.approx(math.sqrt(0.5))


def test_analyze_random_variable_for_constant_outcome_has_zero_variance():
    request = RandomVariableRequest(
        name="resultado constante",
        values=[5],
        probabilities=[1],
    )

    result = analyze_random_variable(request)

    assert result.expected_value == pytest.approx(5)
    assert result.variance == pytest.approx(0)
    assert result.standard_deviation == pytest.approx(0)
