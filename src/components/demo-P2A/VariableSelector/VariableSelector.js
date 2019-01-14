import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { flow, filter, isMatch, pick, some, sortBy } from 'lodash/fp';

import ConstrainedMetadataSelector from '../../ConstrainedMetadataSelector/ConstrainedMetadataSelector';

import './VariableSelector.css';


export default class VariableSelector extends Component {
  static propTypes = {
    constraint: PropTypes.object,
  };

  static valueProps =
    'variable_id variable_name'.split(' ');
  static getOptionValue = metadatum =>
    pick(VariableSelector.valueProps, metadatum);

  static getOptionLabel = ({ value: { variable_id, variable_name }}) =>
    `${variable_id} - ${variable_name}`;

  render() {
    return (
      <ConstrainedMetadataSelector
        {...this.props}
        getOptionValue={VariableSelector.getOptionValue}
        getOptionLabel={VariableSelector.getOptionLabel}
        debugValue='Variable'
      />
    );
  }
}
