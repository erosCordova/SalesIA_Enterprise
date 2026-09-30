from math import sqrt

from app.schemas.statistics import (
    BayesRequest,
    BayesResponse,
    CompareStatisticsResponse,
    MeanResponse,
    MedianResponse,
    NumericValuesRequest,
    RandomVariableRequest,
    RandomVariableResponse,
)


def calculate_mean(
    data: NumericValuesRequest,
) -> MeanResponse:
    values = data.values

    result = sum(values) / len(values)

    return MeanResponse(
        count=len(values),
        mean=result,
    )


def calculate_median(
    data: NumericValuesRequest,
) -> MedianResponse:
    values = sorted(data.values)

    count = len(values)
    middle = count // 2

    if count % 2 == 1:
        result = values[middle]
    else:
        result = (
            values[middle - 1]
            + values[middle]
        ) / 2

    return MedianResponse(
        count=count,
        median=result,
    )


def compare_statistics(
    data: NumericValuesRequest,
) -> CompareStatisticsResponse:
    mean = calculate_mean(data).mean
    median = calculate_median(data).median

    difference = abs(mean - median)

    if difference == 0:
        interpretation = (
            "La media y la mediana coinciden."
        )
    elif mean > median:
        interpretation = (
            "La media es mayor que la mediana; "
            "valores altos pueden estar elevando "
            "el promedio."
        )
    else:
        interpretation = (
            "La mediana es mayor que la media; "
            "valores bajos pueden estar reduciendo "
            "el promedio."
        )

    return CompareStatisticsResponse(
        count=len(data.values),
        mean=mean,
        median=median,
        difference=difference,
        interpretation=interpretation,
    )


def calculate_bayes(
    data: BayesRequest,
) -> BayesResponse:
    posterior = (
        data.probability_b_given_a
        * data.probability_a
    ) / data.probability_b

    return BayesResponse(
        event_a=data.event_a,
        event_b=data.event_b,
        probability_a=data.probability_a,
        probability_b_given_a=(
            data.probability_b_given_a
        ),
        probability_b=data.probability_b,
        posterior_probability=posterior,
        formula="P(A|B) = P(B|A) × P(A) / P(B)",
        interpretation=(
            f"La probabilidad de {data.event_a} "
            f"dado {data.event_b} es "
            f"{posterior:.4f}."
        ),
    )


def analyze_random_variable(
    data: RandomVariableRequest,
) -> RandomVariableResponse:
    expected_value = sum(
        value * probability
        for value, probability in zip(
            data.values,
            data.probabilities,
        )
    )

    variance = sum(
        probability
        * ((value - expected_value) ** 2)
        for value, probability in zip(
            data.values,
            data.probabilities,
        )
    )

    standard_deviation = sqrt(
        variance
    )

    return RandomVariableResponse(
        name=data.name,
        expected_value=expected_value,
        variance=variance,
        standard_deviation=standard_deviation,
        observations=len(data.values),
    )
