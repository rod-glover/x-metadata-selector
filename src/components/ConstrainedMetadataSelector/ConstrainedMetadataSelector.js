import PropTypes from 'prop-types';
import React from 'react';

import './ConstrainedMetadataSelector.css';
import { isMatch, some, omit } from 'lodash/fp';
import MetadataSelector from '../MetadataSelector';


export default class ConstrainedMetadataSelector extends React.Component {
  static propTypes = {
    constraint: PropTypes.object,
  };

  // Can't be static: needs to access props.
  getOptionIsDisabled = option => !some(
    context => isMatch(this.props.constraint, context)
  )(option.contexts);

  render() {
    return (
      <MetadataSelector
        {...omit('constraint', this.props)}
        getOptionIsDisabled={this.getOptionIsDisabled}
      />
    );
  }
}
