import PropTypes from 'prop-types';
import React, { Component } from 'react';

import ConstrainedMetadataSelector from '../../ConstrainedMetadataSelector/ConstrainedMetadataSelector';

import './ModelSelector.css';


export default class ModelSelector extends Component {
  static propTypes = {
    constraint: PropTypes.object,
    debugValue: PropTypes.any,
  };

  static getOptionValue = metadatum => metadatum.model_id;

  render() {
    return (
      <ConstrainedMetadataSelector
        {...this.props}
        getOptionValue={ModelSelector.getOptionValue}
        debug={false}
        debugValue='Model'
      />
    );
  }
}
