import PropTypes from 'prop-types';
import React, { Component } from 'react';

import ConstrainedMetadataSelector from '../ConstrainedMetadataSelector';

import './DatasetSelector.css';
import { pick } from 'lodash/fp';


export default class DatasetSelector extends Component {
  static propTypes = {
    constraint: PropTypes.object,
  };

  static valueProps =
    'start_date end_date ensemble_member'.split(' ');
  static getOptionValue = metadatum =>
    pick(DatasetSelector.valueProps, metadatum);

  static getOptionLabel = ({ value: { start_date, end_date, ensemble_member }}) =>
    `${ensemble_member} ${start_date}-${end_date}`;
  
  render() {
    return null;
    console.log('DatasetSelector.render')
    return (
      <ConstrainedMetadataSelector
        {...this.props}
        getOptionValue={DatasetSelector.getOptionValue}
        getOptionLabel={DatasetSelector.getOptionLabel}
      />
    );
  }
}
