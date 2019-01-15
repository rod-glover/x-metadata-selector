import PropTypes from 'prop-types';
import React, { Component } from 'react';

import ConstrainedMetadataSelector from '../../ConstrainedMetadataSelector/ConstrainedMetadataSelector';

import './EmissionsScenarioSelector.css';


export default class EmissionsScenarioSelector extends Component {
  static propTypes = {
    constraint: PropTypes.object,
  };

  static getOptionValue = metadatum => metadatum.experiment;

  render() {
    return (
      <ConstrainedMetadataSelector
        {...this.props}
        getOptionValue={EmissionsScenarioSelector.getOptionValue}
        debugValue='Emissions'
      />
    );
  }
}
