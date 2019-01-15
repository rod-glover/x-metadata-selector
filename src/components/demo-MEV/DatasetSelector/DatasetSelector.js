import PropTypes from 'prop-types';
import React, { Component } from 'react';

import ConstrainedMetadataSelector from '../../ConstrainedMetadataSelector/ConstrainedMetadataSelector';

import './DatasetSelector.css';
import { flow, fromPairs, pick, map, uniq } from 'lodash/fp';
import { mapWithKey } from '../../../utils/fp';


export default class DatasetSelector extends Component {
  static propTypes = {
    constraint: PropTypes.object,
  };

  static valueProps =
    'start_date end_date ensemble_member'.split(' ');
  static getOptionValue = metadatum =>
    pick(DatasetSelector.valueProps, metadatum);

  // Return an object mapping `ensemble_member` (r-i-p) values to more
  // user-friendly 'Run <n>' values. For the current collection of datasets,
  // there is almost always only one distinct ensemble_member, and so a
  // very simple object mapping the one r-i-p value to 'Run 1'. But this
  // will handle all cases.
  static ensembleMemberTranslation = (meta) =>
    flow(
      map('ensemble_member'),
      uniq,
      mapWithKey((ensemble_member, i) => [ensemble_member, `Run ${i+1}`]),
      fromPairs,
    )(meta);

  // Return an option label including the user-friendly 'Run <n>' names
  // for ensemble_member values.
  getOptionLabel = ({ value: { start_date, end_date, ensemble_member }}) => {
    const eMT = DatasetSelector.ensembleMemberTranslation(this.props.bases);
    return `${eMT[ensemble_member]} (${ensemble_member}), ${start_date}–${end_date}`;
  };
  
  render() {
    console.log('DatasetSelector.render')
    return (
      <ConstrainedMetadataSelector
        {...this.props}
        getOptionValue={DatasetSelector.getOptionValue}
        getOptionLabel={this.getOptionLabel}
        debugValue='Dataset'
      />
    );
  }
}
