import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { flow, filter, isMatch, pick, some, sortBy } from 'lodash/fp';

import ConstrainedMetadataSelector from '../../ConstrainedMetadataSelector/ConstrainedMetadataSelector';

import './TimePeriodSelector.css';


export default class TimePeriodSelector extends Component {
  static propTypes = {
    constraint: PropTypes.object,
  };

  static valueProps =
    'start_date end_date'.split(' ');
  static getOptionValue = metadatum =>
    pick(TimePeriodSelector.valueProps, metadatum);

  static getOptionLabel = ({ value: { start_date, end_date }}) =>
    `${start_date}-${end_date}`;

  render() {
    return (
      <ConstrainedMetadataSelector
        {...this.props}
        getOptionValue={TimePeriodSelector.getOptionValue}
        getOptionLabel={TimePeriodSelector.getOptionLabel}
        debugValue='TimePeriod'
      />
    );
  }
}
