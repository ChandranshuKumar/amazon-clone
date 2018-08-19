import { Spinner } from "./spin";

$(function(){

    Stripe.setPublishableKey('pk_test_5FkgpGhtCXBOZkX55nqWMGcI');

    var opts = {
        lines: 13, // The number of lines to draw
        length: 38, // The length of each line
        width: 17, // The line thickness
        radius: 45, // The radius of the inner circle
        scale: 1, // Scales overall size of the spinner
        corners: 1, // Corner roundness (0..1)
        color: '#ffffff', // CSS color or array of colors
        fadeColor: 'transparent', // CSS color or array of colors
        speed: 1, // Rounds per second
        rotate: 0, // The rotation offset
        animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
        direction: 1, // 1: clockwise, -1: counterclockwise
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        className: 'spinner', // The CSS class to assign to the spinner
        top: '50%', // Top position relative to parent
        left: '50%', // Left position relative to parent
        shadow: '0 0 1px transparent', // Box-shadow for the lines
        position: 'absolute' // Element positioning
      };

    $('#search').keyup(function(){
        let search_term = $(this).val();

        $.ajax({
            method: 'POST',
            url: '/api/search',
            data: { search_term },
            dataType: 'json',
            success: function(json){
                const data = json.hits.hits.map(function(hit){
                    return hit;
                });
                
                $('#searchResults').empty();
                for(let i = 0; i < data.length; i++) {
                    let html = "";
                    html += '<div class="col-md-4">';
                    html += '<a href="/product/' + data[i]._source._id + '">';
                    html += '<div class="thumbnail">';
                    html += '<img src="' + data[i]._source.image + '" alt="Product">';
                    html += '<div class="caption">';
                    html += '<h3>' + data[i]._source.name + '</h3>';
                    html += '<p>' + data[i]._source.category.name + '</p>';
                    html += '<p>Rs.' + data[i]._source.price + '</p>';
                    html += '</div></div></a></div>';

                    $('#searchResults').append(html);
                }
            },
            error: error => console.log(error)
        });
    });


    $(document).on('click', '#plus', function(e){
        e.preventDefault();
        let priceValue = parseFloat($('#priceValue').val());
        let quantity = parseInt($('#quantity').val());

        priceValue += parseFloat($('#priceHidden').val());
        quantity += 1;

        $('#quantity').val(quantity);
        $('#priceValue').val(priceValue.toFixed(2));
        $('#total').html(quantity);
    });

    $(document).on('click', '#minus', function(e){
        e.preventDefault();
        let priceValue = parseFloat($('#priceValue').val());
        let quantity = parseInt($('#quantity').val());

        if(quantity == 1){
            priceValue = $('#priceHidden').val();
            quantity = 1;
        } else {
            priceValue -= parseFloat($('#priceHidden').val());
            quantity -= 1;
        }
        
        $('#quantity').val(quantity);
        $('#priceValue').val(priceValue.toFixed(2));
        $('#total').html(quantity);
    });

    

    stripeResponseHandler = function(status, response){
        var $form = $('#payment-form');
        if(response.error){
            $form.find('.payment-error').text(response.error.message);
            $form.find('#submit').prop('disabled', false);
        } else {
            const token = response.id;
            $form.append($('<input type="hidden" name="stripeToken" />').val(token));
            const spinner = new Spinner(opts).spin();
            $('#loading').append(spinner.el);
            $form.get(0).submit();
        }
    };

    $('#payment-form').submit((event) => {
        $form.find('#submit').prop('disabled', true);
        Stripe.card.createToken($form, stripeResponseHandler);
        return false;
    });

});