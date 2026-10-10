export interface SalesDistributionBin {
  label: string;
  lower_bound: number;
  upper_bound: number;
  count: number;
}


export interface SalesBusinessStatistics {
  branch_id: string | null;
  branch_name: string;

  start_date: string;
  end_date: string;

  count: number;
  total_revenue: number;

  mean: number;
  median: number;

  variance: number;
  standard_deviation: number;

  minimum: number;
  maximum: number;
  range_value: number;

  q1: number;
  q3: number;
  iqr: number;

  coefficient_variation: number;

  variability_label: string;
  interpretation: string;

  distribution:
    SalesDistributionBin[];
}
