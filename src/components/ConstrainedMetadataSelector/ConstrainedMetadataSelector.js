import PropTypes from 'prop-types';
import React from 'react';

import './ConstrainedMetadataSelector.css';
import { isMatch, some, omit } from 'lodash/fp';
import MetadataSelector from '../MetadataSelector';


export default class ConstrainedMetadataSelector extends React.Component {
  static propTypes = {
    constraint: PropTypes.object,
    debugValue: PropTypes.any,
  };

  makeGetOptionIsDisabled = constraint => (
    // Returns a `getOptionIsDisabled` function based on the passed in
    // constraint. It is important that the function be a distinct function
    // for each constraint, instead of the same function (object) that closes
    // over `this.props.constraint`. The change in prop (`getOptionIsDisabeled`)
    // tells `MetadataSelector` that it must re-render. (Otherwise it has the
    // option not to, which in this case it takes, causing an error if the
    // same (ref), but differently-behaving function is passed in.)
    //
    // (This is a place where JS's otherwise good FP design falls down,
    // and comes down to the broader shortcoming that objects are mutable.)
    option => !some(
      context => isMatch(this.props.constraint, context)
    )(option.contexts)

  );

  render() {
    return (
      <MetadataSelector
        {...omit('constraint', this.props)}
        getOptionIsDisabled={this.makeGetOptionIsDisabled(this.props.constraint)}
      />
    );
  }
}
